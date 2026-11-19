import { applicationDefault, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const expectedProjectId = 'greeningapp-d28b6';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const assetRoot = path.join(repoRoot, 'src', 'assets');

const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || `${expectedProjectId}.firebasestorage.app`;
const adminApp = getApps().length ? getApp() : initializeApp({
  credential: applicationDefault(),
  projectId: expectedProjectId,
  storageBucket,
});

if (adminApp.options.projectId !== expectedProjectId) {
  throw new Error(`Refusing to write: expected Firebase project ${expectedProjectId}, got ${adminApp.options.projectId || 'unknown'}.`);
}

const db = getFirestore(adminApp);
const storage = getStorage(adminApp);
const bucket = storage.bucket();

const readAsset = (assetName) => path.join(assetRoot, assetName);

const productAssets = {
  serum: readAsset('Vitamin C serum.png'),
  moisturizer: readAsset('Moistrizer.png'),
  wash: readAsset('Face wash.png'),
  mask: readAsset('FaceMask.png'),
  toner: readAsset('Face Toner.png'),
  sunscreen: readAsset('Sun Screen Cream.png'),
};

const categories = [
  {
    id: 'cat_serum',
    name: 'Serum',
    description: 'Brightening and treatment serums for daily skin renewal.',
    imageUrl: '',
    isActive: true,
    isTestData: true,
  },
  {
    id: 'cat_moisturizer',
    name: 'Moisturizer',
    description: 'Hydrating formulas that lock in moisture and support the skin barrier.',
    imageUrl: '',
    isActive: true,
    isTestData: true,
  },
  {
    id: 'cat_cleanser',
    name: 'Cleanser',
    description: 'Gentle cleansing essentials that remove buildup without stripping skin.',
    imageUrl: '',
    isActive: true,
    isTestData: true,
  },
  {
    id: 'cat_mask',
    name: 'Mask',
    description: 'Weekly masks for glow, repair, and deep nourishment.',
    imageUrl: '',
    isActive: true,
    isTestData: true,
  },
  {
    id: 'cat_toner',
    name: 'Toner',
    description: 'Balancing toners that prep skin and refine texture.',
    imageUrl: '',
    isTestData: true,
    isActive: true,
  },
  {
    id: 'cat_sunscreen',
    name: 'Sunscreen',
    description: 'Daily protection against UV exposure and environmental stress.',
    imageUrl: '',
    isActive: true,
    isTestData: true,
  },
];

const productSeed = [
  {
    productId: 'prod-vc-serum',
    name: 'Vitamin C Serum',
    description: 'Brightening serum infused with antioxidant-rich vitamin C for a luminous, even glow.',
    category: 'Serum',
    price: 1200,
    originalPrice: 1600,
    stock: 24,
    imagePath: productAssets.serum,
    ingredients: ['Vitamin C', 'Niacinamide', 'Hyaluronic Acid'],
    skinType: 'All skin types',
    isActive: true,
    featured: true,
    isTestData: true,
  },
  {
    productId: 'prod-hydra-moisturizer',
    name: 'Hydrating Moisturizer',
    description: 'Lightweight daily moisturizer that replenishes moisture and cushions the skin barrier.',
    category: 'Moisturizer',
    price: 1350,
    originalPrice: 1750,
    stock: 18,
    imagePath: productAssets.moisturizer,
    ingredients: ['Glycerin', 'Ceramides', 'Seaweed Extract'],
    skinType: 'Dry to combination',
    isActive: true,
    featured: true,
    isTestData: true,
  },
  {
    productId: 'prod-gentle-face-wash',
    name: 'Gentle Face Wash',
    description: 'Creamy cleanser that lifts excess oil while preserving a soft, balanced finish.',
    category: 'Cleanser',
    price: 980,
    originalPrice: 1300,
    stock: 32,
    imagePath: productAssets.wash,
    ingredients: ['Oat Milk', 'Chamomile', 'Bamboo Extract'],
    skinType: 'Sensitive and normal skin',
    isActive: true,
    featured: false,
    isTestData: true,
  },
  {
    productId: 'prod-radiance-mask',
    name: 'Radiance Face Mask',
    description: 'A velvet-soft sheet mask that restores radiance and leaves the complexion refreshed.',
    category: 'Mask',
    price: 1450,
    originalPrice: 1950,
    stock: 15,
    imagePath: productAssets.mask,
    ingredients: ['Rice Enzymes', 'Snow Mushroom', 'Peptides'],
    skinType: 'Dull and tired skin',
    isActive: true,
    featured: true,
    isTestData: true,
  },
  {
    productId: 'prod-rose-toner',
    name: 'Rose Dew Toner',
    description: 'Soothing hydration toner that softens and provides a fresh, dewy finish.',
    category: 'Toner',
    price: 1100,
    originalPrice: 1450,
    stock: 28,
    imagePath: productAssets.toner,
    ingredients: ['Rose Water', 'Panthenol', 'Green Tea'],
    skinType: 'All skin types',
    isActive: true,
    featured: false,
    isTestData: true,
  },
  {
    productId: 'prod-sun-shield',
    name: 'Sun Shield Cream',
    description: 'High-protection sunscreen designed for comfortable all-day UV defense.',
    category: 'Sunscreen',
    price: 1600,
    originalPrice: 2100,
    stock: 21,
    imagePath: productAssets.sunscreen,
    ingredients: ['Zinc Oxide', 'Squalane', 'Vitamin E'],
    skinType: 'All skin types',
    isActive: true,
    featured: true,
    isTestData: true,
  },
  {
    productId: 'prod-berry-essence',
    name: 'Berry Glow Essence',
    description: 'A fast-absorbing essence that boosts hydration and leaves skin luminous.',
    category: 'Serum',
    price: 1280,
    originalPrice: 1700,
    stock: 20,
    imagePath: productAssets.serum,
    ingredients: ['Berry Extract', 'Aloe Vera', 'Peptides'],
    skinType: 'Normal to dry skin',
    isActive: true,
    featured: false,
    isTestData: true,
  },
  {
    productId: 'prod-barrier-cream',
    name: 'Barrier Repair Cream',
    description: 'Rich but comfortable cream to restore softness and improve resilience.',
    category: 'Moisturizer',
    price: 1500,
    originalPrice: 2000,
    stock: 12,
    imagePath: productAssets.moisturizer,
    ingredients: ['Ceramides', 'Shea Butter', 'Centella'],
    skinType: 'Dry and sensitive skin',
    isActive: true,
    featured: true,
    isTestData: true,
  },
  {
    productId: 'prod-green-tea-cleanser',
    name: 'Green Tea Cleanser',
    description: 'Refreshingly light cleanser that purifies without leaving the skin tight.',
    category: 'Cleanser',
    price: 1050,
    originalPrice: 1400,
    stock: 26,
    imagePath: productAssets.wash,
    ingredients: ['Green Tea', 'Salicylic Acid', 'AHA'],
    skinType: 'Oily and combination skin',
    isActive: true,
    featured: false,
    isTestData: true,
  },
  {
    productId: 'prod-night-renewal',
    name: 'Night Renewal Serum',
    description: 'Targeted nighttime treatment that supports skin recovery while you sleep.',
    category: 'Serum',
    price: 1680,
    originalPrice: 2200,
    stock: 17,
    imagePath: productAssets.serum,
    ingredients: ['Retinol', 'Bakuchiol', 'Hyaluronic Acid'],
    skinType: 'Mature skin',
    isActive: true,
    featured: true,
    isTestData: true,
  },
];

const customerSeed = [
  {
    customerId: 'cust-t-001',
    uid: 'cust-t-001',
    name: 'Ayesha Khan',
    email: 'ayesha.khan.test@example.com',
    phone: '+923001112233',
    addresses: [{
      label: 'Home',
      fullAddress: 'House 12, Gulshan Avenue, Karachi',
      city: 'Karachi',
      postalCode: '75200',
    }],
    profileImage: '',
    isActive: true,
    isTestData: true,
  },
  {
    customerId: 'cust-t-002',
    uid: 'cust-t-002',
    name: 'Maham Ali',
    email: 'maham.ali.test@example.com',
    phone: '+923331114455',
    addresses: [{
      label: 'Office',
      fullAddress: 'Suite 7, Clifton Plaza, Karachi',
      city: 'Karachi',
      postalCode: '75600',
    }],
    profileImage: '',
    isActive: true,
    isTestData: true,
  },
  {
    customerId: 'cust-t-003',
    uid: 'cust-t-003',
    name: 'Sara Ahmed',
    email: 'sara.ahmed.test@example.com',
    phone: '+923451118877',
    addresses: [{
      label: 'Home',
      fullAddress: 'Flat 3, Gulistan-e-Jauhar, Karachi',
      city: 'Karachi',
      postalCode: '75300',
    }],
    profileImage: '',
    isActive: true,
    isTestData: true,
  },
  {
    customerId: 'cust-t-004',
    uid: 'cust-t-004',
    name: 'Rimsha Noor',
    email: 'rimsha.noor.test@example.com',
    phone: '+923551223344',
    addresses: [{
      label: 'Home',
      fullAddress: 'Block C, DHA Phase 6, Karachi',
      city: 'Karachi',
      postalCode: '75500',
    }],
    profileImage: '',
    isActive: true,
    isTestData: true,
  },
  {
    customerId: 'cust-t-005',
    uid: 'cust-t-005',
    name: 'Zoya Rehman',
    email: 'zoya.rehman.test@example.com',
    phone: '+923771112233',
    addresses: [{
      label: 'Home',
      fullAddress: 'Street 18, North Nazimabad, Karachi',
      city: 'Karachi',
      postalCode: '74700',
    }],
    profileImage: '',
    isActive: true,
    isTestData: true,
  },
];

const statusHistoryTemplate = (status, notes = 'System update') => ({
  status,
  notes,
  updatedAt: new Date(),
});

const orders = [
  {
    orderId: 'SKN-2026-000001',
    customerId: 'cust-t-001',
    customerName: 'Ayesha Khan',
    customerEmail: 'ayesha.khan.test@example.com',
    customerPhone: '+923001112233',
    shippingAddress: 'House 12, Gulshan Avenue, Karachi',
    items: [
      { productId: 'prod-vc-serum', name: 'Vitamin C Serum', quantity: 1, unitPrice: 1200, lineTotal: 1200 },
      { productId: 'prod-rose-toner', name: 'Rose Dew Toner', quantity: 1, unitPrice: 1100, lineTotal: 1100 },
    ],
    subtotal: 2300,
    deliveryCharges: 250,
    discount: 0,
    totalAmount: 2550,
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'Pending',
    orderStatus: 'Pending',
    statusHistory: [statusHistoryTemplate('Pending', 'Order created pending confirmation')],
    isTestData: true,
  },
  {
    orderId: 'SKN-2026-000002',
    customerId: 'cust-t-002',
    customerName: 'Maham Ali',
    customerEmail: 'maham.ali.test@example.com',
    customerPhone: '+923331114455',
    shippingAddress: 'Suite 7, Clifton Plaza, Karachi',
    items: [
      { productId: 'prod-hydra-moisturizer', name: 'Hydrating Moisturizer', quantity: 2, unitPrice: 1350, lineTotal: 2700 },
    ],
    subtotal: 2700,
    deliveryCharges: 300,
    discount: 200,
    totalAmount: 2800,
    paymentMethod: 'Card',
    paymentStatus: 'Paid',
    orderStatus: 'Confirmed',
    statusHistory: [
      statusHistoryTemplate('Confirmed', 'Payment received and order confirmed'),
    ],
    isTestData: true,
  },
  {
    orderId: 'SKN-2026-000003',
    customerId: 'cust-t-003',
    customerName: 'Sara Ahmed',
    customerEmail: 'sara.ahmed.test@example.com',
    customerPhone: '+923451118877',
    shippingAddress: 'Flat 3, Gulistan-e-Jauhar, Karachi',
    items: [
      { productId: 'prod-gentle-face-wash', name: 'Gentle Face Wash', quantity: 3, unitPrice: 980, lineTotal: 2940 },
    ],
    subtotal: 2940,
    deliveryCharges: 250,
    discount: 0,
    totalAmount: 3190,
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'Pending',
    orderStatus: 'Processing',
    statusHistory: [
      statusHistoryTemplate('Processing', 'Order packed and moving to dispatch'),
    ],
    isTestData: true,
  },
  {
    orderId: 'SKN-2026-000004',
    customerId: 'cust-t-004',
    customerName: 'Rimsha Noor',
    customerEmail: 'rimsha.noor.test@example.com',
    customerPhone: '+923551223344',
    shippingAddress: 'Block C, DHA Phase 6, Karachi',
    items: [
      { productId: 'prod-radiance-mask', name: 'Radiance Face Mask', quantity: 1, unitPrice: 1450, lineTotal: 1450 },
      { productId: 'prod-sun-shield', name: 'Sun Shield Cream', quantity: 1, unitPrice: 1600, lineTotal: 1600 },
    ],
    subtotal: 3050,
    deliveryCharges: 300,
    discount: 100,
    totalAmount: 3250,
    paymentMethod: 'Debit Card',
    paymentStatus: 'Paid',
    orderStatus: 'Shipped',
    statusHistory: [
      statusHistoryTemplate('Shipped', 'Courier assigned and package in transit'),
    ],
    isTestData: true,
  },
  {
    orderId: 'SKN-2026-000005',
    customerId: 'cust-t-005',
    customerName: 'Zoya Rehman',
    customerEmail: 'zoya.rehman.test@example.com',
    customerPhone: '+923771112233',
    shippingAddress: 'Street 18, North Nazimabad, Karachi',
    items: [
      { productId: 'prod-barrier-cream', name: 'Barrier Repair Cream', quantity: 1, unitPrice: 1500, lineTotal: 1500 },
      { productId: 'prod-green-tea-cleanser', name: 'Green Tea Cleanser', quantity: 2, unitPrice: 1050, lineTotal: 2100 },
    ],
    subtotal: 3600,
    deliveryCharges: 250,
    discount: 0,
    totalAmount: 3850,
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'Paid',
    orderStatus: 'Out for Delivery',
    statusHistory: [
      statusHistoryTemplate('Out for Delivery', 'Driver has left the warehouse and is en route'),
    ],
    isTestData: true,
  },
  {
    orderId: 'SKN-2026-000006',
    customerId: 'cust-t-001',
    customerName: 'Ayesha Khan',
    customerEmail: 'ayesha.khan.test@example.com',
    customerPhone: '+923001112233',
    shippingAddress: 'House 12, Gulshan Avenue, Karachi',
    items: [
      { productId: 'prod-night-renewal', name: 'Night Renewal Serum', quantity: 1, unitPrice: 1680, lineTotal: 1680 },
    ],
    subtotal: 1680,
    deliveryCharges: 250,
    discount: 0,
    totalAmount: 1930,
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'Paid',
    orderStatus: 'Delivered',
    statusHistory: [
      statusHistoryTemplate('Delivered', 'Package delivered to recipient'),
    ],
    isTestData: true,
  },
  {
    orderId: 'SKN-2026-000007',
    customerId: 'cust-t-002',
    customerName: 'Maham Ali',
    customerEmail: 'maham.ali.test@example.com',
    customerPhone: '+923331114455',
    shippingAddress: 'Suite 7, Clifton Plaza, Karachi',
    items: [
      { productId: 'prod-vc-serum', name: 'Vitamin C Serum', quantity: 2, unitPrice: 1200, lineTotal: 2400 },
    ],
    subtotal: 2400,
    deliveryCharges: 250,
    discount: 300,
    totalAmount: 2350,
    paymentMethod: 'Card',
    paymentStatus: 'Paid',
    orderStatus: 'Cancelled',
    statusHistory: [
      statusHistoryTemplate('Cancelled', 'Customer requested cancellation before dispatch'),
    ],
    isTestData: true,
  },
  {
    orderId: 'SKN-2026-000008',
    customerId: 'cust-t-003',
    customerName: 'Sara Ahmed',
    customerEmail: 'sara.ahmed.test@example.com',
    customerPhone: '+923451118877',
    shippingAddress: 'Flat 3, Gulistan-e-Jauhar, Karachi',
    items: [
      { productId: 'prod-berry-essence', name: 'Berry Glow Essence', quantity: 1, unitPrice: 1280, lineTotal: 1280 },
      { productId: 'prod-rose-toner', name: 'Rose Dew Toner', quantity: 2, unitPrice: 1100, lineTotal: 2200 },
    ],
    subtotal: 3480,
    deliveryCharges: 250,
    discount: 100,
    totalAmount: 3630,
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'Pending',
    orderStatus: 'Pending',
    statusHistory: [
      statusHistoryTemplate('Pending', 'Awaiting warehouse processing'),
    ],
    isTestData: true,
  },
];

const messages = [
  {
    messageId: 'msg-test-001',
    name: 'Aisha Karim',
    email: 'aisha.karim@example.com',
    subject: 'Wholesale inquiry',
    message: 'I would like to know whether you offer skincare bundles for retail partners. Please share pricing and minimum order quantities.',
    status: 'Unread',
    isTestData: true,
  },
  {
    messageId: 'msg-test-002',
    name: 'Hira Mehmood',
    email: 'hira.mehmood@example.com',
    subject: 'Product recommendation',
    message: 'I have dry sensitive skin and would like guidance on the best routine for hydration and irritation relief.',
    status: 'Read',
    isTestData: true,
  },
  {
    messageId: 'msg-test-003',
    name: 'Sanam Qureshi',
    email: 'sanam.qureshi@example.com',
    subject: 'Delivery delay',
    message: 'My order has not been updated for several days. Could you advise on the current shipment status?',
    status: 'Pending',
    isTestData: true,
  },
  {
    messageId: 'msg-test-004',
    name: 'Nida Hasan',
    email: 'nida.hasan@example.com',
    subject: 'Ingredient question',
    message: 'Do your sunscreen products contain fragrance? I am looking for a gentle formula for sensitive skin.',
    status: 'Unread',
    isTestData: true,
  },
  {
    messageId: 'msg-test-005',
    name: 'Rabia Tariq',
    email: 'rabia.tariq@example.com',
    subject: 'Return request',
    message: 'I received my order but the cleanser was not the fragrance-free version I selected. Please help me with a return or exchange.',
    status: 'Read',
    isTestData: true,
  },
];

const notifications = [
  {
    notificationId: 'note-test-001',
    customerId: 'cust-t-001',
    type: 'order',
    title: 'Order confirmation',
    message: 'Your order SKN-2026-000001 has been received and is being reviewed.',
    read: false,
    isTestData: true,
  },
  {
    notificationId: 'note-test-002',
    customerId: 'cust-t-004',
    type: 'shipping',
    title: 'Your package is on the way',
    message: 'Your order SKN-2026-000004 has been shipped.',
    read: true,
    isTestData: true,
  },
  {
    notificationId: 'note-test-003',
    customerId: 'cust-t-005',
    type: 'delivery',
    title: 'Out for delivery',
    message: 'Your order SKN-2026-000005 is out for delivery today.',
    read: false,
    isTestData: true,
  },
];

const ensureDocument = async (collectionPath, documentId, payload) => {
  const ref = db.collection(collectionPath).doc(documentId);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    await ref.set({
      ...payload,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return true;
  }
  return false;
};

const ensureCartEntry = async (customerId, itemId, payload) => {
  const ref = db.collection('carts').doc(customerId).collection('items').doc(itemId);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    await ref.set({
      ...payload,
      updatedAt: FieldValue.serverTimestamp(),
      isTestData: true,
    });
    return true;
  }
  return false;
};

const ensureProductImage = async (product) => {
  const filePath = product.imagePath;
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing asset: ${filePath}`);
  }

  const destination = `products/${product.productId}/${path.basename(filePath)}`;
  const file = bucket.file(destination);
  const [exists] = await file.exists();

  if (!exists) {
    await bucket.upload(filePath, {
      destination,
      gzip: true,
      metadata: {
        contentType: 'image/png',
      },
    });
    await file.makePublic();
  }

  const url = file.publicUrl();
  return {
    imageUrl: url,
    imageUrls: [url],
    imagePath: destination,
  };
};

const main = async () => {
  console.log(`Verifying target project: ${expectedProjectId}`);
  console.log(`Admin SDK project: ${adminApp.options.projectId}`);

  const settingsRef = db.collection('settings').doc('storeSettings');
  const existingSettings = await settingsRef.get();
  if (!existingSettings.exists) {
    await settingsRef.set({
      storeName: 'SKINORA',
      storeEmail: 'hello@skinora.com',
      storePhone: '+923001234567',
      storeAddress: 'Karachi, Pakistan',
      deliveryCharges: 250,
      freeShippingThreshold: 5000,
      currency: 'PKR',
      isTestData: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log('Created settings/storeSettings');
  }

  const orderCounterRef = db.collection('settings').doc('orderCounter');
  const counterSnap = await orderCounterRef.get();
  if (!counterSnap.exists) {
    await orderCounterRef.set({
      year: 2026,
      lastSequence: 8,
      isTestData: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log('Created settings/orderCounter');
  } else {
    console.log('settings/orderCounter already exists; leaving it untouched to protect live data.');
  }

  let uploadedImages = 0;
  const productRefs = new Set();

  for (const category of categories) {
    await ensureDocument('categories', category.id, category);
  }

  for (const product of productSeed) {
    const productDocId = product.productId;
    const productRef = db.collection('products').doc(productDocId);
    const productSnap = await productRef.get();
    if (productSnap.exists) {
      productRefs.add(productDocId);
      continue;
    }

    const imageData = await ensureProductImage(product);
    uploadedImages += 1;
    await productRef.set({
      ...product,
      productId: product.productId,
      category: product.category,
      imageUrl: imageData.imageUrl,
      imageUrls: imageData.imageUrls,
      imagePath: imageData.imagePath,
      originalPrice: product.originalPrice,
      isActive: product.isActive,
      featured: product.featured,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      isTestData: true,
    });
    productRefs.add(productDocId);
    console.log(`Inserted product ${product.productId} with live image URL.`);
  }

  for (const customer of customerSeed) {
    await ensureDocument('customers', customer.customerId, {
      uid: customer.uid,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      addresses: customer.addresses,
      profileImage: customer.profileImage,
      isActive: customer.isActive,
      isTestData: true,
    });
  }

  for (const message of messages) {
    await ensureDocument('messages', message.messageId, {
      ...message,
      createdAt: FieldValue.serverTimestamp(),
      status: message.status,
      isTestData: true,
    });
  }

  for (const order of orders) {
    const orderRef = db.collection('orders').doc(order.orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      await orderRef.set({
        ...order,
        orderId: order.orderId,
        trackingId: order.orderId,
        orderNumber: order.orderId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        orderStatus: order.orderStatus,
        statusHistory: order.statusHistory,
        isTestData: true,
      });
      console.log(`Inserted order ${order.orderId}`);
    }
  }

  for (const item of notifications) {
    await ensureDocument('notifications', item.notificationId, {
      ...item,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      isTestData: true,
    });
  }

  const cartSeed = {
    'cust-t-001': [
      { itemId: 'cart-item-1', productId: 'prod-vc-serum', quantity: 1 },
      { itemId: 'cart-item-2', productId: 'prod-rose-toner', quantity: 2 },
    ],
    'cust-t-002': [
      { itemId: 'cart-item-3', productId: 'prod-hydra-moisturizer', quantity: 1 },
    ],
    'cust-t-003': [
      { itemId: 'cart-item-4', productId: 'prod-gentle-face-wash', quantity: 2 },
    ],
  };

  for (const [customerId, items] of Object.entries(cartSeed)) {
    for (const item of items) {
      await ensureCartEntry(customerId, item.itemId, {
        productId: item.productId,
        quantity: item.quantity,
        isTestData: true,
      });
    }
  }

  console.log('Initialization complete.');
  console.log(`Uploaded ${uploadedImages} product images.`);

  const counts = {};
  for (const collectionName of ['products', 'categories', 'customers', 'orders', 'messages', 'settings', 'notifications', 'carts']) {
    if (collectionName === 'carts') {
      const cartsQuery = await db.collection('carts').get();
      const topLevelCount = cartsQuery.size;
      let subItemCount = 0;
      for (const cartDoc of cartsQuery.docs) {
        const itemsSnap = await cartDoc.ref.collection('items').get();
        subItemCount += itemsSnap.size;
      }
      counts[collectionName] = { documentCount: topLevelCount, itemCount: subItemCount };
      continue;
    }

    const snapshot = await db.collection(collectionName).get();
    counts[collectionName] = snapshot.size;
  }

  console.log(JSON.stringify(counts, null, 2));
};

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});
