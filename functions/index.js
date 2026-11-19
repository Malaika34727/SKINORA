import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const adminApp = getApps().length ? getApp() : initializeApp();
const databaseId = process.env.FIRESTORE_DATABASE_ID;
const db = databaseId ? getFirestore(adminApp, databaseId) : getFirestore(adminApp);

const normalizeEmail = (email) => email.trim().toLowerCase();
const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validPhone = /^\+?[\d\s()-]{7,20}$/;
const validRequestId = /^[a-f0-9]{32}$/i;
const paymentMethods = new Set(['Cash on Delivery', 'Bank Transfer']);
const defaultCheckoutSettings = {
  deliveryCharges: 250,
  freeShippingThreshold: 5000,
};

const checkoutSettingsFrom = (data = {}) => ({
  deliveryCharges: Number.isFinite(data.deliveryCharges) && data.deliveryCharges >= 0
    ? data.deliveryCharges
    : defaultCheckoutSettings.deliveryCharges,
  freeShippingThreshold: Number.isFinite(data.freeShippingThreshold) && data.freeShippingThreshold >= 0
    ? data.freeShippingThreshold
    : defaultCheckoutSettings.freeShippingThreshold,
  currency: typeof data.currency === 'string' && data.currency.trim() ? data.currency.trim() : 'PKR',
});

export const getCheckoutSettings = onCall({
  region: 'us-central1',
  maxInstances: 10,
  enforceAppCheck: true,
}, async () => {
  const settingsSnapshot = await db.collection('settings').doc('storeSettings').get();
  return checkoutSettingsFrom(settingsSnapshot.data());
});

export const ensureCustomerProfile = onCall({
  region: 'us-central1',
  maxInstances: 10,
  enforceAppCheck: true,
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in to save your customer profile.');
  }

  const uid = request.auth.uid;
  const name = typeof request.data?.name === 'string' ? request.data.name.trim() : '';
  const tokenEmail = typeof request.auth.token.email === 'string' ? request.auth.token.email : '';
  const submittedEmail = typeof request.data?.email === 'string' ? request.data.email : '';
  const email = normalizeEmail(tokenEmail || submittedEmail);
  const phone = typeof request.data?.phone === 'string' ? request.data.phone.trim() : '';
  if (name.length < 2 || name.length > 120 || !validEmail.test(email) || phone.length > 30) {
    throw new HttpsError('invalid-argument', 'Enter valid customer profile details.');
  }

  const customerRef = db.collection('customers').doc(uid);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(customerRef);
    const existing = snapshot.data() || {};
    transaction.set(customerRef, {
      uid,
      name,
      email,
      phone,
      addresses: Array.isArray(existing.addresses) ? existing.addresses : [],
      profileImage: typeof existing.profileImage === 'string' ? existing.profileImage : '',
      isActive: existing.isActive !== false,
      createdAt: existing.createdAt || FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });

  return { uid };
});

export const placeOrder = onCall({
  region: 'us-central1',
  maxInstances: 10,
  enforceAppCheck: true,
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in before placing an order.');
  }

  const {
    customerName,
    customerPhone,
    shippingAddress,
    paymentMethod,
    requestId,
    items,
  } = request.data || {};

  if (typeof customerName !== 'string' || customerName.trim().length < 2 || customerName.trim().length > 120) {
    throw new HttpsError('invalid-argument', 'Enter a valid customer name.');
  }
  if (
    typeof request.auth.token.email !== 'string'
    || request.auth.token.email.trim().length > 254
    || !validEmail.test(request.auth.token.email.trim())
  ) {
    throw new HttpsError('failed-precondition', 'Your account must have a valid email address to place an order.');
  }
  if (typeof customerPhone !== 'string' || !validPhone.test(customerPhone.trim())) {
    throw new HttpsError('invalid-argument', 'Enter a valid phone number.');
  }
  if (typeof shippingAddress !== 'string' || shippingAddress.trim().length < 8 || shippingAddress.trim().length > 500) {
    throw new HttpsError('invalid-argument', 'Enter a complete shipping address.');
  }
  if (!paymentMethods.has(paymentMethod)) {
    throw new HttpsError('invalid-argument', 'Choose a supported payment method.');
  }
  if (typeof requestId !== 'string' || !validRequestId.test(requestId)) {
    throw new HttpsError('invalid-argument', 'The order request is invalid. Please try again.');
  }
  if (!Array.isArray(items) || items.length < 1 || items.length > 50) {
    throw new HttpsError('invalid-argument', 'Your cart is empty or contains too many products.');
  }

  const requestedItems = new Map();
  for (const item of items) {
    if (
      typeof item?.productId !== 'string'
      || !item.productId
      || !Number.isInteger(item.quantity)
      || item.quantity < 1
      || item.quantity > 99
    ) {
      throw new HttpsError('invalid-argument', 'The cart contains an invalid product or quantity.');
    }
    requestedItems.set(item.productId, (requestedItems.get(item.productId) || 0) + item.quantity);
    if (requestedItems.get(item.productId) > 99) {
      throw new HttpsError('invalid-argument', 'A product quantity cannot exceed 99.');
    }
  }

  const orderRequestRef = db.collection('orderRequests').doc(requestId);
  const customerUid = request.auth.uid;
  const customerRef = db.collection('customers').doc(customerUid);
  const counterRef = db.collection('settings').doc('orderCounter');
  const storeSettingsRef = db.collection('settings').doc('storeSettings');
  const productRefs = [...requestedItems.keys()].map((id) => db.collection('products').doc(id));
  const orderYear = new Date().getUTCFullYear();
  const normalizedName = customerName.trim();
  const normalizedEmail = normalizeEmail(request.auth.token.email);
  const phone = customerPhone.trim();
  const address = shippingAddress.trim();

  try {
    return await db.runTransaction(async (transaction) => {
      const existingRequest = await transaction.get(orderRequestRef);
      if (existingRequest.exists) {
        const requestOwnerUid = existingRequest.data().customerUid;
        if (requestOwnerUid && requestOwnerUid !== customerUid) {
          throw new HttpsError('permission-denied', 'This order request belongs to a different customer.');
        }
        const existingOrderId = existingRequest.data().orderId;
        const existingOrder = existingOrderId ? await transaction.get(db.collection('orders').doc(existingOrderId)) : null;
        if (existingOrder && existingOrder.exists) {
          const order = existingOrder.data();
          if (order.customerUid !== customerUid) {
            throw new HttpsError('permission-denied', 'This order request belongs to a different customer.');
          }
          const orderId = order.orderId || order.trackingId || order.orderNumber || existingOrder.id;
          return {
            duplicate: true,
            id: existingOrder.id,
            orderId,
            orderNumber: orderId,
            trackingId: orderId,
            customerId: order.customerId || null,
            customerUid: order.customerUid || null,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            customerPhone: order.customerPhone,
            shippingAddress: order.shippingAddress || '',
            items: order.items || [],
            subtotal: order.subtotal || 0,
            deliveryCharges: order.deliveryCharges || 0,
            shippingCharges: order.shippingCharges || order.deliveryCharges || 0,
            totalAmount: order.totalAmount || 0,
            paymentMethod: order.paymentMethod || 'Cash on Delivery',
            paymentStatus: order.paymentStatus || 'Pending',
            status: order.status || order.orderStatus || 'Pending',
            statusHistory: order.statusHistory || [],
            orderDate: order.orderDate?.toDate?.().toISOString()
              || order.createdAt?.toDate?.().toISOString()
              || new Date().toISOString(),
          };
        }
      }

      const [customerSnapshot, counterSnapshot, storeSettingsSnapshot] = await Promise.all([
        transaction.get(customerRef),
        transaction.get(counterRef),
        transaction.get(storeSettingsRef),
      ]);
      const productSnapshots = [];
      for (const productRef of productRefs) {
        productSnapshots.push(await transaction.get(productRef));
      }

      const orderItems = productSnapshots.map((productSnapshot) => {
        if (!productSnapshot.exists) {
          throw new HttpsError('not-found', 'A product in your cart is no longer available.');
        }

        const product = productSnapshot.data();
        const quantity = requestedItems.get(productSnapshot.id);
        if (!Number.isFinite(product.price) || product.price < 0) {
          throw new HttpsError('failed-precondition', `${product.name || 'A product'} has an invalid price.`);
        }
        const unitPrice = Number.isFinite(product.discountPrice)
          && product.discountPrice >= 0
          && product.discountPrice <= product.price
          ? product.discountPrice
          : product.price;
        if (product.status === 'inactive') {
          throw new HttpsError('failed-precondition', `${product.name || 'A product'} is no longer available.`);
        }
        if (!Number.isInteger(product.stock) || product.stock < quantity) {
          throw new HttpsError('failed-precondition', `${product.name || 'A product'} does not have enough stock.`);
        }

        return {
          productId: productSnapshot.id,
          name: product.name,
          quantity,
          unitPrice,
          lineTotal: unitPrice * quantity,
          imageUrl: product.imageUrl || '',
        };
      });

      const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
      const checkoutSettings = checkoutSettingsFrom(storeSettingsSnapshot.data());
      const deliveryCharges = subtotal >= checkoutSettings.freeShippingThreshold
        ? 0
        : checkoutSettings.deliveryCharges;
      const totalAmount = subtotal + deliveryCharges;
      const counter = counterSnapshot.data();
      const lastSequence = counter?.year === orderYear ? counter.lastSequence : 0;
      if (!Number.isSafeInteger(lastSequence) || lastSequence < 0) {
        throw new HttpsError('internal', 'The order number counter is invalid.');
      }
      let sequence = lastSequence + 1;
      let orderId = '';
      let orderRef;
      let orderSnapshot;
      for (let attempt = 0; attempt < 100; attempt += 1) {
        orderId = `SKN-${orderYear}-${String(sequence).padStart(5, '0')}`;
        orderRef = db.collection('orders').doc(orderId);
        orderSnapshot = await transaction.get(orderRef);
        if (!orderSnapshot.exists) break;
        sequence += 1;
      }
      if (!orderSnapshot || orderSnapshot.exists || !Number.isSafeInteger(sequence)) {
        throw new HttpsError('already-exists', 'A unique order number could not be allocated. Please contact support.');
      }

      const now = new Date().toISOString();
      const order = {
        id: orderId,
        orderId,
        orderNumber: orderId,
        trackingId: orderId,
        requestId,
        customerId: customerUid,
        customerUid,
        customerName: normalizedName,
        customerEmail: normalizedEmail,
        customerPhone: phone,
        shippingAddress: address,
        items: orderItems,
        subtotal,
        deliveryCharges,
        shippingCharges: deliveryCharges,
        totalAmount,
        paymentMethod,
        paymentStatus: 'Pending',
        status: 'Pending',
        statusHistory: [{
          status: 'Pending',
          updatedAt: Timestamp.now(),
          updatedBy: customerUid,
        }],
        orderDate: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      transaction.set(orderRef, order);
      transaction.set(orderRequestRef, {
        requestId,
        orderId,
        customerUid,
        customerEmail: normalizedEmail,
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      transaction.set(counterRef, {
        year: orderYear,
        lastSequence: sequence,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      const existingCustomer = customerSnapshot.data() || {};
      transaction.set(customerRef, {
        uid: customerUid,
        name: normalizedName,
        email: normalizedEmail,
        phone,
        addresses: Array.isArray(existingCustomer.addresses) ? existingCustomer.addresses : [],
        profileImage: typeof existingCustomer.profileImage === 'string' ? existingCustomer.profileImage : '',
        isActive: existingCustomer.isActive !== false,
        orderCount: (Number.isSafeInteger(existingCustomer.orderCount) ? existingCustomer.orderCount : 0) + 1,
        createdAt: existingCustomer.createdAt || FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      productSnapshots.forEach((productSnapshot) => {
        transaction.update(productSnapshot.ref, {
          stock: productSnapshot.data().stock - requestedItems.get(productSnapshot.id),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });

      return {
        duplicate: false,
        orderId,
        orderNumber: orderId,
        trackingId: orderId,
        customerId: customerUid,
        customerUid,
        customerName: normalizedName,
        customerEmail: normalizedEmail,
        customerPhone: phone,
        shippingAddress: address,
        items: orderItems,
        subtotal,
        deliveryCharges,
        shippingCharges: deliveryCharges,
        totalAmount,
        paymentMethod,
        paymentStatus: 'Pending',
        status: 'Pending',
        orderDate: now,
      };
    });
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logger.error('placeOrder failed', {
      requestId,
      customerUid,
      error: error?.message || String(error),
      stack: error?.stack,
    });
    throw new HttpsError(
      'internal',
      `We could not place your order. Reference: ${requestId}. Please try again or contact support.`,
    );
  }
});

const orderStatuses = new Set(['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']);

export const updateOrderStatus = onCall({
  region: 'us-central1',
  maxInstances: 10,
  enforceAppCheck: true,
}, async (request) => {
  const { orderId, status } = request.data || {};
  const normalizedOrderId = typeof orderId === 'string' ? orderId.trim() : '';

  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in as an administrator to update orders.');
  }
  if (!normalizedOrderId || !/^(SKN-\d{4}-\d{5,}|[a-f0-9]{32})$/i.test(normalizedOrderId) || !orderStatuses.has(status)) {
    throw new HttpsError('invalid-argument', 'The order status update is invalid.');
  }

  const adminRef = db.collection('admins').doc(request.auth.uid);
  const orderRef = db.collection('orders').doc(normalizedOrderId);
  try {
    return await db.runTransaction(async (transaction) => {
      const adminSnapshot = await transaction.get(adminRef);
      if (!adminSnapshot.exists && request.auth.token.admin !== true) {
        throw new HttpsError('permission-denied', 'Administrator access is required.');
      }

      const orderSnapshot = await transaction.get(orderRef);
      if (!orderSnapshot.exists) {
        throw new HttpsError('not-found', 'This order no longer exists.');
      }

      const order = orderSnapshot.data();
      if (order.status === status) return { status };
      if (order.status === 'Cancelled') {
        throw new HttpsError('failed-precondition', 'A cancelled order cannot be reopened.');
      }
      if (status === 'Cancelled' && ['Shipped', 'Delivered'].includes(order.status)) {
        throw new HttpsError('failed-precondition', 'Shipped or delivered orders cannot be cancelled from this screen.');
      }

      let productSnapshots = [];
      if (status === 'Cancelled') {
        const productRefs = (order.items || []).map((item) => db.collection('products').doc(item.productId));
        for (const productRef of productRefs) {
          productSnapshots.push(await transaction.get(productRef));
        }
      }

      productSnapshots.forEach((productSnapshot, index) => {
        if (!productSnapshot.exists) return;
        const quantity = order.items[index].quantity;
        const stock = productSnapshot.data().stock;
        if (!Number.isInteger(stock) || stock < 0 || !Number.isInteger(quantity) || quantity < 1) {
          throw new HttpsError('failed-precondition', 'The inventory for this order cannot be restored safely.');
        }
        transaction.update(productSnapshot.ref, {
          stock: stock + quantity,
          updatedAt: FieldValue.serverTimestamp(),
        });
      });

      transaction.update(orderRef, {
        status,
        statusHistory: [
          ...(Array.isArray(order.statusHistory) ? order.statusHistory : []),
          {
            status,
            updatedAt: Timestamp.now(),
            updatedBy: request.auth.uid,
          },
        ],
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: request.auth.uid,
      });
      return { status };
    });
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'The order status could not be updated.');
  }
});
