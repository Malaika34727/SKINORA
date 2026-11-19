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
import { db } from '../firebase';

const categoryCollection = collection(db, 'categories');
const customerCollection = collection(db, 'customers');
const messageCollection = collection(db, 'messages');
const notificationCollection = collection(db, 'notifications');
const settingsRef = doc(db, 'settings', 'storeSettings');

export const listenToCategories = (onCategories, onError) => onSnapshot(
  query(categoryCollection, orderBy('name', 'asc')),
  (snapshot) => onCategories(snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))),
  onError,
);

export const createCategory = async (values) => {
  const name = String(values.name || '').trim();
  const description = String(values.description || '').trim();
  if (!name) throw new Error('Enter a category name.');

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

  return { id: categoryRef.id, name, description, imageUrl: values.imageUrl || '', isActive: true };
};

export const updateCategory = async (categoryId, values) => {
  const ref = doc(db, 'categories', categoryId);
  await updateDoc(ref, {
    ...values,
    name: String(values.name || '').trim(),
    description: String(values.description || '').trim(),
    updatedAt: serverTimestamp(),
  });
};

export const deleteCategory = async (categoryId) => {
  await deleteDoc(doc(db, 'categories', categoryId));
};

export const listenToCustomers = (onCustomers, onError) => onSnapshot(
  query(customerCollection, orderBy('createdAt', 'desc')),
  (snapshot) => onCustomers(snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))),
  onError,
);

export const listenToMessages = (onMessages, onError) => onSnapshot(
  query(messageCollection, orderBy('createdAt', 'desc')),
  (snapshot) => onMessages(snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))),
  onError,
);

export const updateMessageStatus = async (messageId, status) => {
  const ref = doc(db, 'messages', messageId);
  await updateDoc(ref, {
    status,
    updatedAt: serverTimestamp(),
  });
};

export const deleteMessage = async (messageId) => {
  await deleteDoc(doc(db, 'messages', messageId));
};

export const listenToNotifications = (onNotifications, onError) => onSnapshot(
  query(notificationCollection, orderBy('createdAt', 'desc')),
  (snapshot) => onNotifications(snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))),
  onError,
);

export const createNotification = async (values) => {
  const message = String(values.message || '').trim();
  const title = String(values.title || '').trim();
  if (!title || !message) throw new Error('Notification title and message are required.');

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

  return { id: ref.id, notificationId: ref.id, ...values, title, message };
};

export const updateNotification = async (notificationId, values) => {
  const ref = doc(db, 'notifications', notificationId);
  await updateDoc(ref, {
    ...values,
    title: String(values.title || '').trim(),
    message: String(values.message || '').trim(),
    updatedAt: serverTimestamp(),
  });
};

export const deleteNotification = async (notificationId) => {
  await deleteDoc(doc(db, 'notifications', notificationId));
};

export const listenToSettings = (onSettings, onError) => onSnapshot(
  settingsRef,
  (snapshot) => onSettings(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null),
  onError,
);

export const saveStoreSettings = async (values) => {
  const payload = {
    storeName: String(values.storeName || '').trim() || 'SKINORA',
    storeEmail: String(values.storeEmail || '').trim(),
    storePhone: String(values.storePhone || '').trim(),
    storeAddress: String(values.storeAddress || '').trim(),
    deliveryCharges: Number(values.deliveryCharges || 0),
    freeShippingThreshold: Number(values.freeShippingThreshold || 0),
    currency: String(values.currency || 'PKR').trim().toUpperCase(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(settingsRef, payload, { merge: true });
  return payload;
};

export const listenToOrders = (onOrders, onError) => onSnapshot(
  query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
  (snapshot) => onOrders(snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))),
  onError,
);

export const listenToOrderMessages = (onMessages, onError) => {
  const queryRef = query(messageCollection, where('status', 'in', ['Unread', 'Pending']), orderBy('createdAt', 'desc'));
  return onSnapshot(queryRef, (snapshot) => onMessages(snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))), onError);
};
