
import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';

import { db } from '../firebase';

// REALTIME CUSTOMER ORDERS
export const listenToCustomerOrders = (uid, onOrders, onError) => {
  return onSnapshot(
    query(
      collection(db, 'orders'),
      where('customerUid', '==', uid)
    ),
    (snapshot) => {
      const orders = snapshot.docs.map((orderDocument) => ({
        id: orderDocument.id,
        ...orderDocument.data(),
      }));

      orders.sort((first, second) => {
        const firstDate = first.createdAt?.toMillis?.() || 0;
        const secondDate = second.createdAt?.toMillis?.() || 0;
        return secondDate - firstDate;
      });

      onOrders(orders);
    },
    onError
  );
};

// APP CHECK IS NOT BEING USED
export const assertAppCheckConfigured = () => true;

// CLOUD FUNCTIONS NOT ENABLED
const cloudFunctionsUnavailable = () => {
  throw new Error(
    'This feature is not configured yet. Firebase Cloud Functions are currently disabled.'
  );
};

export const getCheckoutSettings = async () => {
  return cloudFunctionsUnavailable();
};

export const ensureCustomerProfile = async () => {
  return cloudFunctionsUnavailable();
};

export const placeOrder = async () => {
  return cloudFunctionsUnavailable();
};

export const updateOrderStatus = async () => {
  return cloudFunctionsUnavailable();
};

// ORDER ERROR MESSAGE
export const getOrderSubmissionError = (error) => {
  const message =
    typeof error?.message === 'string' ? error.message.trim() : '';

  return message ||
    'The order could not be submitted. Please try again.';
};
