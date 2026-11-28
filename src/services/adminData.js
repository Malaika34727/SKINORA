
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import {
  superAdminDb,
  secondaryDb,
} from '../firebase';

// ==========================================
// SELECT DATABASE ACCORDING TO ACTIVE PANEL
// ==========================================

const getAdminDb = () => {
  const activePanel = sessionStorage.getItem(
    'skinora_active_admin_panel'
  );

  return activePanel === 'superAdmin'
    ? superAdminDb
    : secondaryDb;
};

// ==========================================
// CATEGORIES
// ==========================================

export const listenToCategories = (onCategories, onError) => {
  const db = getAdminDb();

  const categoryCollection = collection(db, 'categories');

  return onSnapshot(
    query(categoryCollection, orderBy('name', 'asc')),
    (snapshot) =>
      onCategories(
        snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        }))
      ),
    onError
  );
};

export const createCategory = async (values) => {
  const db = getAdminDb();

  const name = String(values.name || '').trim();
  const description = String(values.description || '').trim();

  if (!name) {
    throw new Error('Enter a category name.');
  }

  const categoryCollection = collection(db, 'categories');
  const categoryRef = doc(categoryCollection);

  await setDoc(categoryRef, {
    id: categoryRef.id,
    name,
    description,
    imageUrl: values.imageUrl || '',
    isActive: true,
    isTestData: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    id: categoryRef.id,
    name,
    description,
    imageUrl: values.imageUrl || '',
    isActive: true,
  };
};

export const updateCategory = async (categoryId, values) => {
  const db = getAdminDb();

  const ref = doc(db, 'categories', categoryId);

  await updateDoc(ref, {
    ...values,
    name: String(values.name || '').trim(),
    description: String(values.description || '').trim(),
    updatedAt: serverTimestamp(),
  });
};

export const deleteCategory = async (categoryId) => {
  const db = getAdminDb();

  await deleteDoc(doc(db, 'categories', categoryId));
};

// ==========================================
// CUSTOMERS
// ==========================================

export const listenToCustomers = (onCustomers, onError) => {
  const db = getAdminDb();

  // Read existing customer signup records
  const customerCollection = collection(db, 'CREATEACCUSER');

  return onSnapshot(
    query(customerCollection, orderBy('createdAt', 'desc')),
    (snapshot) =>
      onCustomers(
        snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        }))
      ),
    onError
  );
};

// ==========================================
// MESSAGES
// ==========================================

export const listenToMessages = (onMessages, onError) => {
  const db = getAdminDb();

  const messageCollection = collection(db, 'messages');

  return onSnapshot(
    query(messageCollection, orderBy('createdAt', 'desc')),
    (snapshot) =>
      onMessages(
        snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        }))
      ),
    onError
  );
};

export const updateMessageStatus = async (messageId, status) => {
  const db = getAdminDb();

  const ref = doc(db, 'messages', messageId);

  await updateDoc(ref, {
    status,
    updatedAt: serverTimestamp(),
  });
};

export const deleteMessage = async (messageId) => {
  const db = getAdminDb();

  await deleteDoc(doc(db, 'messages', messageId));
};

// ==========================================
// NOTIFICATIONS
// ==========================================

export const listenToNotifications = (
  onNotifications,
  onError
) => {
  const db = getAdminDb();

  const notificationCollection = collection(
    db,
    'notifications'
  );

  return onSnapshot(
    query(notificationCollection, orderBy('createdAt', 'desc')),
    (snapshot) =>
      onNotifications(
        snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        }))
      ),
    onError
  );
};

export const createNotification = async (values) => {
  const db = getAdminDb();

  const message = String(values.message || '').trim();
  const title = String(values.title || '').trim();

  if (!title || !message) {
    throw new Error(
      'Notification title and message are required.'
    );
  }

  const notificationCollection = collection(
    db,
    'notifications'
  );

  const ref = doc(notificationCollection);

  await setDoc(ref, {
    id: ref.id,
    notificationId: ref.id,
    customerId: values.customerId || 'all',
    type: values.type || 'general',
    title,
    message,
    read: false,
    isTestData: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    id: ref.id,
    notificationId: ref.id,
    ...values,
    title,
    message,
  };
};

export const updateNotification = async (
  notificationId,
  values
) => {
  const db = getAdminDb();

  const ref = doc(db, 'notifications', notificationId);

  await updateDoc(ref, {
    ...values,
    title: String(values.title || '').trim(),
    message: String(values.message || '').trim(),
    updatedAt: serverTimestamp(),
  });
};

export const deleteNotification = async (
  notificationId
) => {
  const db = getAdminDb();

  await deleteDoc(
    doc(db, 'notifications', notificationId)
  );
};

// ==========================================
// STORE SETTINGS
// ==========================================

export const listenToSettings = (onSettings, onError) => {
  const db = getAdminDb();

  const settingsRef = doc(
    db,
    'settings',
    'storeSettings'
  );

  return onSnapshot(
    settingsRef,
    (snapshot) =>
      onSettings(
        snapshot.exists()
          ? {
              id: snapshot.id,
              ...snapshot.data(),
            }
          : null
      ),
    onError
  );
};

export const saveStoreSettings = async (values) => {
  const db = getAdminDb();

  const settingsRef = doc(
    db,
    'settings',
    'storeSettings'
  );

  const payload = {
    storeName:
      String(values.storeName || '').trim() || 'SKINORA',
    storeEmail: String(values.storeEmail || '').trim(),
    storePhone: String(values.storePhone || '').trim(),
    storeAddress: String(values.storeAddress || '').trim(),
    deliveryCharges: Number(values.deliveryCharges || 0),
    freeShippingThreshold: Number(
      values.freeShippingThreshold || 0
    ),
    currency: String(values.currency || 'PKR')
      .trim()
      .toUpperCase(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(settingsRef, payload, { merge: true });

  return payload;
};

// ==========================================
// ORDERS
// ==========================================

export const listenToOrders = (onOrders, onError) => {
  const db = getAdminDb();

  const ordersCollection = collection(db, 'orders');

  return onSnapshot(
    query(ordersCollection, orderBy('createdAt', 'desc')),
    (snapshot) =>
      onOrders(
        snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        }))
      ),
    onError
  );
};

// ==========================================
// ORDER MESSAGES
// ==========================================

export const listenToOrderMessages = (
  onMessages,
  onError
) => {
  const db = getAdminDb();

  const messageCollection = collection(db, 'messages');

  const queryRef = query(
    messageCollection,
    where('status', 'in', ['Unread', 'Pending']),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    queryRef,
    (snapshot) =>
      onMessages(
        snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        }))
      ),
    onError
  );
};
