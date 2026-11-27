
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
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

const normalizeEmail = (email = '') =>
  email.trim().toLowerCase();

const SUPER_ADMIN_UID = 'sDbSHVhgrmcPfLv0PJP2QDfLKFp1';

const SUPER_ADMIN_EMAIL = 'dbestmalaika@gmail.com';

// ==========================================
// ROLE PERMISSIONS
// ==========================================

const rolePermissions = {
  productManager: {
    viewProducts: true,
    addProduct: true,
    updateProduct: true,
    deleteProduct: true,
    importProducts: true,
  },

  orderManager: {
    viewOrders: true,
    updateOrderStatus: true,
    verifyPayments: true,
  },
};

// ==========================================
// GET ALL ASSIGNED PERMISSIONS
// ==========================================

const getUserPermissions = (permissions = {}) => {
  const allPermissionKeys = Object.values(rolePermissions)
    .flatMap((group) => Object.keys(group));

  return Object.fromEntries(
    allPermissionKeys.map((key) => [
      key,
      permissions[key] === true,
    ])
  );
};

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
      console.warn('Verification email could not be sent:', error);
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

  // Block Super Admin from customer portal

  if (
    user.uid === SUPER_ADMIN_UID ||
    normalizeEmail(user.email) === SUPER_ADMIN_EMAIL
  ) {
    await signOut(auth);

    throw new Error(
      'Administrator accounts cannot log in through the customer portal.'
    );
  }

  // Check whether this account is a Sub Admin

  const adminStatus = await getAdminStatus(user);

  if (adminStatus.isAdmin) {
    await signOut(auth);

    throw new Error(
      'Sub Admin accounts cannot log in through the customer portal.'
    );
  }

  // ======================================
  // CUSTOMER PROFILE
  // ======================================

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

  // ======================================
  // LOGIN RECORD
  // ======================================

  try {
    await addDoc(collection(db, 'LOGINUSER'), {
      uid: user.uid,
      email: user.email,
      provider: 'password',
      loggedInAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Login record could not be saved:', error);
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
// LOGOUT CUSTOMER
// ==========================================

export const signOutCustomer = async () => {
  await signOut(auth);
};

// ==========================================
// GET ADMIN STATUS
// ==========================================

export const getAdminStatus = async (
  user,
  adminDatabase = db
) => {
  const denied = (source = 'none') => ({
    isAdmin: false,
    role: null,
    permissions: {},
    source,
  });

  if (!user) {
    return denied();
  }

  try {
    await user.reload();

    if (!user.emailVerified) {
      return denied('unverified');
    }

    // ======================================
    // SUPER ADMIN VERIFICATION
    // Always use Main Firestore
    // ======================================

    if (user.uid === SUPER_ADMIN_UID) {
      const adminRef = doc(
        db,
        'ADMIN',
        SUPER_ADMIN_UID
      );

      const snapshot = await getDoc(adminRef);

      if (!snapshot.exists()) {
        return denied();
      }

      const data = snapshot.data();

      const authorized =
        normalizeEmail(user.email) === SUPER_ADMIN_EMAIL &&
        data.uid === SUPER_ADMIN_UID &&
        normalizeEmail(data.email) === SUPER_ADMIN_EMAIL &&
        data.role === 'admin' &&
        data.isActive === true;

      if (!authorized) {
        return denied('super-admin');
      }

      return {
        isAdmin: true,
        role: 'admin',
        permissions: {},
        source: 'super-admin',
      };
    }

    // ======================================
    // SUB ADMIN VERIFICATION
    // Use selected Firestore instance
    // ======================================

    const subAdminRef = doc(
      adminDatabase,
      'ADMIN',
      SUPER_ADMIN_UID,
      'SUBADMIN',
      user.uid
    );

    const subAdminSnapshot = await getDoc(subAdminRef);

    if (!subAdminSnapshot.exists()) {
      return denied();
    }

    const subAdminData = subAdminSnapshot.data();

    const subAdminRole = subAdminData.role;

    const authorized =
      subAdminData.uid === user.uid &&
      normalizeEmail(user.email) ===
        normalizeEmail(subAdminData.email) &&
      Object.hasOwn(rolePermissions, subAdminRole) &&
      subAdminData.isActive === true;

    if (!authorized) {
      return denied('sub-admin');
    }

    // Read permissions from both groups.
    // Selected panel controls which permissions are usable.

    const permissions = getUserPermissions(
      subAdminData.permissions || {}
    );

    return {
      isAdmin: true,
      role: subAdminRole,
      permissions,
      source: 'sub-admin',
    };
  } catch (error) {
    console.error('Admin status check failed:', error);

    return {
      ...denied('error'),
      error: error.message || 'Admin verification failed.',
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

  const allowedFields = ['name', 'phone'];

  const safeUpdates = Object.fromEntries(
    Object.entries(updates).filter(([key]) =>
      allowedFields.includes(key)
    )
  );

  if (Object.keys(safeUpdates).length === 0) {
    throw new Error('No valid profile fields to update.');
  }

  await updateDoc(customerRef, safeUpdates);

  return {
    uid,
    ...safeUpdates,
  };
};
