
import {
  initializeApp,
  getApps,
} from 'firebase/app';

import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyB4wkSP2luX7HX1H7uYC2h9eNNfrkbtjko",
  authDomain: "greeningapp-d28b6.firebaseapp.com",
  projectId: "greeningapp-d28b6",
  storageBucket: "greeningapp-d28b6.firebasestorage.app",
  messagingSenderId: "597804317596",
  appId: "1:597804317596:web:baf77f193440373703a659"
};

// =====================================
// MAIN APP — CUSTOMER AUTHENTICATION
// =====================================

const app = getApps().find(
  (item) => item.name === '[DEFAULT]'
) || initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// =====================================
// SUPER ADMIN — SEPARATE AUTH & DATABASE
// =====================================

const superAdminApp = getApps().find(
  (item) => item.name === 'SuperAdminApp'
) || initializeApp(firebaseConfig, 'SuperAdminApp');

export const superAdminAuth = getAuth(superAdminApp);
export const superAdminDb = getFirestore(superAdminApp);

// =====================================
// SUB ADMIN — SEPARATE AUTH & DATABASE
// =====================================

const secondaryApp = getApps().find(
  (item) => item.name === 'SecondaryApp'
) || initializeApp(firebaseConfig, 'SecondaryApp');

export const secondaryAuth = getAuth(secondaryApp);
export const secondaryDb = getFirestore(secondaryApp);
export const secondaryStorage = getStorage(secondaryApp);

export default app;
