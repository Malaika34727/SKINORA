
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB4wkSP2luX7HX1H7uYC2h9eNNfrkbtjko",
  authDomain: "greeningapp-d28b6.firebaseapp.com",
  projectId: "greeningapp-d28b6",
  storageBucket: "greeningapp-d28b6.firebasestorage.app",
  messagingSenderId: "597804317596",
  appId: "1:597804317596:web:baf77f193440373703a659"
};

// Initialize Firebase
const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

// Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
