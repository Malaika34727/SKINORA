
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  getIdTokenResult,
} from 'firebase/auth';

import {
  addDoc,
  collection,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';

import { auth, db } from '../firebase';

const normalizeEmail = (email = '') => email.trim().toLowerCase();


// ==========================================
// CREATE CUSTOMER ACCOUNT
// ==========================================

export const createCustomerAccount = async ({
  name,
  email,
  password,
}) => {
  const trimmedName = name.trim();
  const normalizedEmail = normalizeEmail(email);

  if (trimmedName.length < 2 || trimmedName.length > 120) {
    throw new Error('Name must be between 2 and 120 characters.');
  }

  const credential = await createUserWithEmailAndPassword(
    auth,
    normalizedEmail,
    password
  );

  const user = credential.user;

  try {
    await updateProfile(user, {
      displayName: trimmedName,
    });

    await setDoc(doc(db, 'CREATEACCUSER', user.uid), {
      uid: user.uid,
      name: trimmedName,
      email: normalizedEmail,
      provider: 'password',
      cart: [],
      createdAt: serverTimestamp(),
    });

    try {
      await sendEmailVerification(user);
    } catch (error) {
      console.warn(
        'Verification email could not be sent:',
        error
      );
    }

    return user;

  } catch (error) {
    throw new Error(
      `Account was created, but Firestore registration failed: ${error.message}`
    );
  }
};


// ==========================================
// CUSTOMER LOGIN
// ==========================================

export const signInCustomer = async (email, password) => {
  const credential = await signInWithEmailAndPassword(
    auth,
    normalizeEmail(email),
    password
  );

  const user = credential.user;

  // Check whether customer profile exists.
  // If missing, recover it for an already-created Auth account.

  try {
    const customerRef = doc(db, 'CREATEACCUSER', user.uid);
    const customerSnapshot = await getDoc(customerRef);

    if (!customerSnapshot.exists()) {
      await setDoc(customerRef, {
        uid: user.uid,
        name: user.displayName || 'Customer',
        email: user.email,
        provider: 'password',
        cart: [],
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Customer profile check failed:', error);
  }

  // Save login history without logging the user out
  try {
    await addDoc(collection(db, 'LOGINUSER'), {
      uid: user.uid,
      email: user.email,
      provider: 'password',
      loggedInAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(
      'Login record could not be saved:',
      error
    );
  }

  return user;
};


// ==========================================
// PASSWORD RESET
// ==========================================

export const resetCustomerPassword = async (email) => {
  await sendPasswordResetEmail(
    auth,
    normalizeEmail(email)
  );
};


// ==========================================
// LOGOUT
// ==========================================

export const signOutCustomer = async () => {
  await signOut(auth);
};


// ==========================================
// ADMIN STATUS
// ==========================================

export const getAdminStatus = async (user) => {
  if (!user) {
    return {
      isAdmin: false,
      source: 'none',
    };
  }

  try {
    const token = await getIdTokenResult(user, true);

    if (token.claims.admin === true) {
      return {
        isAdmin: true,
        source: 'custom-claim',
      };
    }
  } catch (error) {
    console.warn('Admin token check failed:', error);
  }

  try {
    const snapshot = await getDoc(
      doc(db, 'admins', user.uid)
    );

    return {
      isAdmin: snapshot.exists(),
      source: snapshot.exists()
        ? 'firestore-doc'
        : 'none',
    };

  } catch (error) {
    console.error('Admin status check failed:', error);

    return {
      isAdmin: false,
      source: 'error',
    };
  }
};


// ==========================================
// REALTIME CUSTOMER CART
// ==========================================

export const listenToCustomerCart = (
  uid,
  onNext,
  onError
) => {
  const customerRef = doc(
    db,
    'CREATEACCUSER',
    uid
  );

  return onSnapshot(
    customerRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onNext(null);
        return;
      }

      onNext(snapshot.data().cart || []);
    },
    onError
  );
};


// ==========================================
// SAVE CUSTOMER CART
// ==========================================

export const saveCustomerCart = async (uid, cart) => {
  const customerRef = doc(
    db,
    'CREATEACCUSER',
    uid
  );

  await updateDoc(customerRef, {
    cart,
    cartUpdatedAt: serverTimestamp(),
  });
};


// ==========================================
// GET CUSTOMER PROFILE
// ==========================================

export const getCustomerProfile = async (uid) => {
  const customerRef = doc(
    db,
    'CREATEACCUSER',
    uid
  );

  const snapshot = await getDoc(customerRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
};


// ==========================================
// UPDATE CUSTOMER PROFILE
// ==========================================

export const updateCustomerProfile = async (
  uid,
  updates
) => {
  const customerRef = doc(
    db,
    'CREATEACCUSER',
    uid
  );

  const allowedFields = [
    'name',
    'phone',
  ];

  const safeUpdates = Object.fromEntries(
    Object.entries(updates).filter(([key]) =>
      allowedFields.includes(key)
    )
  );

  if (Object.keys(safeUpdates).length === 0) {
    throw new Error(
      'No valid profile fields to update.'
    );
  }

  await updateDoc(customerRef, safeUpdates);

  return {
    uid,
    ...safeUpdates,
  };
};
