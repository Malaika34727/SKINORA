
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  arrayUnion,
} from 'firebase/firestore';

import { auth, db } from '../firebase';

// =====================================================
// COLLECTIONS
// =====================================================

const ORDERS_COLLECTION = 'SKINORA_ORDERS';
const PRODUCTS_COLLECTION = 'products';
const SETTINGS_COLLECTION = 'settings';
const ORDER_COUNTER_DOC = 'orderCounter';

// =====================================================
// BASIC HELPERS
// =====================================================

const getProductId = (item) =>
  item?.productId ||
  item?.id ||
  item?.product?.id ||
  item?.product?.productId ||
  '';

const getQuantity = (item) =>
  Number(item?.quantity ?? item?.qty ?? 0);

const getProductPrice = (product) =>
  Number(
    product?.salePrice ??
    product?.discountPrice ??
    product?.price ??
    0
  );

const getProductStock = (product) =>
  product?.stock ??
  product?.stockQuantity ??
  product?.quantity ??
  null;

const getProductName = (product, cartItem) =>
  product?.name ||
  product?.title ||
  cartItem?.name ||
  cartItem?.title ||
  'Product';

// =====================================================
// IMAGE URL HANDLER
// FIRESTORE imageUrl SUPPORT
// =====================================================

const extractImageUrl = (image) => {
  if (!image) return '';

  if (typeof image === 'string') {
    const value = image.trim();

    if (
      value.startsWith('https://') ||
      value.startsWith('http://')
    ) {
      return value;
    }

    return '';
  }

  if (typeof image === 'object') {
    const possibleUrls = [
      image.imageUrl,
      image.url,
      image.src,
      image.downloadURL,
      image.downloadUrl,
    ];

    for (const url of possibleUrls) {
      if (
        typeof url === 'string' &&
        (
          url.startsWith('https://') ||
          url.startsWith('http://')
        )
      ) {
        return url.trim();
      }
    }
  }

  return '';
};

// =====================================================
// GET PRODUCT IMAGE
// PRIORITY: FIRESTORE imageUrl
// =====================================================

const getProductImage = (product, cartItem) => {
  const candidates = [
    product?.imageUrl,
    product?.image,
    product?.images,

    cartItem?.imageUrl,
    cartItem?.image,
    cartItem?.images,

    product?.product?.imageUrl,
    product?.product?.image,
    cartItem?.product?.imageUrl,
    cartItem?.product?.image,
  ];

  for (const candidate of candidates) {
    const directUrl = extractImageUrl(candidate);

    if (directUrl) return directUrl;

    if (Array.isArray(candidate)) {
      for (const image of candidate) {
        const arrayUrl = extractImageUrl(image);

        if (arrayUrl) return arrayUrl;
      }
    }
  }

  return '';
};

// =====================================================
// CHECKOUT SETTINGS
// =====================================================

export const getCheckoutSettings = async () => {
  try {
    const settingsRef = doc(
      db,
      SETTINGS_COLLECTION,
      'storeSettings'
    );

    const settingsSnap = await getDoc(settingsRef);

    if (!settingsSnap.exists()) {
      return {
        deliveryCharges: 0,
        freeShippingThreshold: 0,
        currency: 'PKR',
      };
    }

    const settings = settingsSnap.data();

    return {
      deliveryCharges: Number(
        settings.deliveryCharges ??
        settings.shippingCharges ??
        settings.deliveryFee ??
        0
      ),

      freeShippingThreshold: Number(
        settings.freeShippingThreshold ??
        settings.freeDeliveryMinimum ??
        settings.freeShippingMinimum ??
        0
      ),

      currency: settings.currency || 'PKR',
    };
  } catch (error) {
    console.error('Checkout settings error:', error);
    throw error;
  }
};

// =====================================================
// PLACE ORDER
// =====================================================

export const placeOrder = async ({
  customer,
  cartItems,
  address,
  phone,
  paymentMethod,
  requestId,
}) => {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('Please login before placing your order.');
    }

    if (!customer?.name?.trim()) {
      throw new Error('Customer name is required.');
    }

    if (!currentUser.email) {
      throw new Error('Customer email is missing.');
    }

    if (!phone?.trim()) {
      throw new Error('Phone number is required.');
    }

    if (!address?.trim()) {
      throw new Error('Delivery address is required.');
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error('Your cart is empty.');
    }

    if (!requestId) {
      throw new Error('Order request ID is missing.');
    }

    if (!paymentMethod) {
      throw new Error('Payment method is required.');
    }

    // -------------------------------------------------
    // AGGREGATE CART ITEMS
    // -------------------------------------------------

    const aggregatedItems = new Map();

    for (const item of cartItems) {
      const productId = getProductId(item);
      const quantity = getQuantity(item);

      if (!productId) {
        throw new Error(
          'A product ID is missing from your cart.'
        );
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error('Invalid product quantity.');
      }

      if (aggregatedItems.has(productId)) {
        const existing = aggregatedItems.get(productId);
        existing.quantity += quantity;
      } else {
        aggregatedItems.set(productId, {
          productId,
          quantity,
          cartItem: item,
        });
      }
    }

    const uid = currentUser.uid;

    // -------------------------------------------------
    // INTERNAL FIREBASE ORDER DOCUMENT ID
    // KEEP THIS FOR DUPLICATE PROTECTION
    // -------------------------------------------------

    const orderId = `${uid}_${requestId}`;

    const orderRef = doc(
      db,
      ORDERS_COLLECTION,
      orderId
    );

    // -------------------------------------------------
    // FIRESTORE TRANSACTION
    // -------------------------------------------------

    const result = await runTransaction(
      db,
      async (transaction) => {
        // ---------------------------------------------
        // DUPLICATE ORDER PROTECTION
        // ---------------------------------------------

        const existingOrder = await transaction.get(orderRef);

        if (existingOrder.exists()) {
          const existingData = existingOrder.data();

          return {
            success: true,
            duplicate: true,
            orderId,
            orderNumber:
              existingData.displayOrderId ||
              existingData.orderNumber ||
              existingData.trackingId ||
              orderId,
            displayOrderId:
              existingData.displayOrderId ||
              existingData.orderNumber ||
              existingData.trackingId ||
              orderId,
            order: existingData,
          };
        }

        // ---------------------------------------------
        // READ STORE SETTINGS
        // ---------------------------------------------

        const settingsRef = doc(
          db,
          SETTINGS_COLLECTION,
          'storeSettings'
        );

        const settingsSnap = await transaction.get(
          settingsRef
        );

        const settings = settingsSnap.exists()
          ? settingsSnap.data()
          : {};

        const deliveryCharges = Number(
          settings.deliveryCharges ??
          settings.shippingCharges ??
          settings.deliveryFee ??
          0
        );

        const freeShippingThreshold = Number(
          settings.freeShippingThreshold ??
          settings.freeDeliveryMinimum ??
          settings.freeShippingMinimum ??
          0
        );

        // ---------------------------------------------
        // READ ORDER COUNTER
        // ---------------------------------------------

        const counterRef = doc(
          db,
          SETTINGS_COLLECTION,
          ORDER_COUNTER_DOC
        );

        const counterSnap = await transaction.get(
          counterRef
        );

        const lastNumber = counterSnap.exists()
          ? Number(counterSnap.data().lastNumber || 0)
          : 0;

        const nextNumber = lastNumber + 1;

        const currentYear = new Date().getFullYear();

        const displayOrderId =
          `SKN-${currentYear}-${String(nextNumber).padStart(5, '0')}`;

        // ---------------------------------------------
        // READ ALL PRODUCTS BEFORE WRITING
        // ---------------------------------------------

        const productEntries = Array.from(
          aggregatedItems.values()
        );

        const productRefs = productEntries.map((entry) =>
          doc(db, PRODUCTS_COLLECTION, entry.productId)
        );

        const productSnapshots = await Promise.all(
          productRefs.map((productRef) =>
            transaction.get(productRef)
          )
        );

        let subtotal = 0;

        const orderItems = [];

        // ---------------------------------------------
        // VALIDATE PRODUCTS & BUILD ORDER ITEMS
        // ---------------------------------------------

        productEntries.forEach((entry, index) => {
          const productSnap = productSnapshots[index];

          if (!productSnap.exists()) {
            throw new Error(
              `Product not found: ${entry.productId}`
            );
          }

          const product = productSnap.data();

          if (
            product.active === false ||
            product.isActive === false ||
            product.status === 'inactive'
          ) {
            throw new Error(
              `${getProductName(
                product,
                entry.cartItem
              )} is currently unavailable.`
            );
          }

          const quantity = entry.quantity;
          const price = getProductPrice(product);

          if (!Number.isFinite(price) || price < 0) {
            throw new Error(
              `Invalid price for ${getProductName(
                product,
                entry.cartItem
              )}.`
            );
          }

          // STOCK VALIDATION

          const stock = getProductStock(product);

          if (stock !== null && stock !== undefined) {
            const availableStock = Number(stock);

            if (
              Number.isFinite(availableStock) &&
              availableStock < quantity
            ) {
              throw new Error(
                `Insufficient stock for ${getProductName(
                  product,
                  entry.cartItem
                )}.`
              );
            }
          }

          const itemTotal = price * quantity;

          subtotal += itemTotal;

          // IMAGE URL FROM FIRESTORE

          const imageUrl = getProductImage(
            product,
            entry.cartItem
          );

          orderItems.push({
            productId: entry.productId,
            name: getProductName(product, entry.cartItem),

            image: imageUrl,
            imageUrl: imageUrl,

            price,
            quantity,
            itemTotal,
          });
        });

        // ---------------------------------------------
        // SHIPPING CALCULATION
        // ---------------------------------------------

        const shipping =
          freeShippingThreshold > 0 &&
          subtotal >= freeShippingThreshold
            ? 0
            : deliveryCharges;

        const totalAmount = subtotal + shipping;

        // ---------------------------------------------
        // CREATE ORDER
        // ---------------------------------------------

        const newOrder = {
          // Internal Firebase ID
          id: orderId,
          orderId,

          // Short customer-facing IDs
          orderNumber: displayOrderId,
          displayOrderId,
          trackingId: displayOrderId,

          customerUid: uid,

          customer: {
            name: customer.name.trim(),
            email: currentUser.email,
            phone: phone.trim(),
          },

          customerName: customer.name.trim(),
          customerEmail: currentUser.email,
          customerPhone: phone.trim(),

          address: address.trim(),
          deliveryAddress: address.trim(),

          items: orderItems,

          subtotal,
          deliveryCharges: shipping,
          shippingCharges: shipping,
          tax: 0,
          totalAmount,

          currency: settings.currency || 'PKR',

          paymentMethod,
          paymentStatus: 'Pending',

          status: 'Pending',

          statusHistory: [
            {
              status: 'Pending',
              note: 'Order placed successfully.',
              timestamp: new Date(),
            },
          ],

          requestId,

          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        // ---------------------------------------------
        // SAVE ORDER
        // ---------------------------------------------

        transaction.set(orderRef, newOrder);

        // ---------------------------------------------
        // UPDATE SEQUENTIAL ORDER COUNTER
        // ---------------------------------------------

        transaction.set(counterRef, {
          lastNumber: nextNumber,
          updatedAt: serverTimestamp(),
        });

        return {
          success: true,
          duplicate: false,

          // Internal ID (for Firebase operations)
          orderId,

          // Customer-friendly ID
          orderNumber: displayOrderId,
          displayOrderId,

          order: newOrder,
        };
      }
    );

    return result;
  } catch (error) {
    console.error('Place order error:', error);
    throw error;
  }
};

// =====================================================
// CUSTOMER ORDERS LISTENER
// =====================================================

export const listenToCustomerOrders = (
  uid,
  callback,
  onError
) => {
  if (!uid) {
    return () => {};
  }

  const ordersRef = collection(
    db,
    ORDERS_COLLECTION
  );

  const ordersQuery = query(
    ordersRef,
    where('customerUid', '==', uid)
  );

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const orders = snapshot.docs.map((orderDoc) => ({
        id: orderDoc.id,
        ...orderDoc.data(),
      }));

      orders.sort((a, b) => {
        const dateA = a.createdAt?.toMillis?.() || 0;
        const dateB = b.createdAt?.toMillis?.() || 0;

        return dateB - dateA;
      });

      callback(orders);
    },
    (error) => {
      console.error(
        'Customer orders listener error:',
        error
      );

      if (onError) onError(error);
    }
  );
};

// =====================================================
// UPDATE ORDER STATUS
// =====================================================

export const updateOrderStatus = async (
  orderId,
  newStatus,
  note = ''
) => {
  const allowedStatuses = [
    'Pending',
    'Processing',
    'Shipped',
    'Delivered',
    'Cancelled',
  ];

  if (!allowedStatuses.includes(newStatus)) {
    throw new Error('Invalid order status.');
  }

  if (!orderId) {
    throw new Error('Order ID is missing.');
  }

  const orderRef = doc(
    db,
    ORDERS_COLLECTION,
    orderId
  );

  const historyEntry = {
    status: newStatus,
    note: note || `Order status changed to ${newStatus}.`,
    timestamp: new Date(),
  };

  await updateDoc(orderRef, {
    status: newStatus,
    statusHistory: arrayUnion(historyEntry),
    updatedAt: serverTimestamp(),
  });

  return {
    success: true,
    orderId,
    status: newStatus,
  };
};

// =====================================================
// CHECKOUT ERROR HANDLER
// =====================================================

export const getOrderSubmissionError = (error) => {
  const code = error?.code || '';
  const message = error?.message || '';

  if (
    code === 'permission-denied' ||
    message.toLowerCase().includes('permission')
  ) {
    return 'Permission denied. Please login again or contact support.';
  }

  if (
    code === 'unavailable' ||
    message.toLowerCase().includes('network')
  ) {
    return 'Network connection problem. Please check your internet and try again.';
  }

  if (code === 'failed-precondition') {
    return 'Checkout is not configured correctly. Please contact support.';
  }

  return message || 'Unable to place your order. Please try again.';
};
