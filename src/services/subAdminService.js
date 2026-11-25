
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  deleteUser,
} from 'firebase/auth';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { auth, db, secondaryAuth } from '../firebase';

const SUPER_ADMIN_UID = 'sDbSHVhgrmcPfLv0PJP2QDfLKFp1';

const subAdminCollection = collection(
  db,
  'ADMIN',
  SUPER_ADMIN_UID,
  'SUBADMIN'
);

// ==========================================
// PRODUCT MANAGER PERMISSIONS
// ==========================================

export const productManagerPermissions = {
  viewProducts: true,
  addProduct: true,
  updateProduct: true,
  deleteProduct: true,
  importProducts: false,
};

// ==========================================
// ORDER MANAGER PERMISSIONS
// ==========================================

export const orderManagerPermissions = {
  viewOrders: true,
  updateOrderStatus: true,
  verifyPayments: true,
};

// ==========================================
// ROLE CONFIGURATION
// ==========================================

const roleConfiguration = {
  productManager: {
    label: 'Product Manager',
    permissions: productManagerPermissions,
  },
  orderManager: {
    label: 'Order Manager',
    permissions: orderManagerPermissions,
  },
};

// ==========================================
// VERIFY SUPER ADMIN
// ==========================================

const verifySuperAdmin = () => {
  if (auth.currentUser?.uid !== SUPER_ADMIN_UID) {
    throw new Error('Only the Super Admin can manage Sub Admins.');
  }
};

// ==========================================
// NORMALIZE PERMISSIONS
// ==========================================

const normalizePermissions = (role, permissions = {}) => {
  const configuration = roleConfiguration[role];

  if (!configuration) {
    throw new Error('Invalid Sub Admin role.');
  }

  const normalized = {};

  Object.keys(configuration.permissions).forEach((permission) => {
    normalized[permission] = permissions[permission] === true;
  });

  return normalized;
};

// ==========================================
// CREATE SUB ADMIN
// ==========================================

export const createSubAdmin = async ({
  email,
  password,
  role = 'productManager',
  permissions,
}) => {
  verifySuperAdmin();

  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error('Please enter a Sub Admin email.');
  }

  if (!password || password.length < 6) {
    throw new Error('Password must contain at least 6 characters.');
  }

  const configuration = roleConfiguration[role];

  if (!configuration) {
    throw new Error('Invalid Sub Admin role.');
  }

  const safePermissions = normalizePermissions(
    role,
    permissions ?? configuration.permissions
  );

  let credential = null;

  try {
    credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      normalizedEmail,
      password
    );

    const subAdmin = credential.user;

    const subAdminRef = doc(
      db,
      'ADMIN',
      SUPER_ADMIN_UID,
      'SUBADMIN',
      subAdmin.uid
    );

    await setDoc(subAdminRef, {
      uid: subAdmin.uid,
      email: normalizedEmail,
      role,
      roleLabel: configuration.label,
      permissions: safePermissions,
      isActive: true,
      createdBy: SUPER_ADMIN_UID,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    let verificationSent = true;

    try {
      await sendEmailVerification(subAdmin);
    } catch (emailError) {
      verificationSent = false;
      console.error('Verification email could not be sent:', emailError);
    }

    return {
      uid: subAdmin.uid,
      email: normalizedEmail,
      role,
      verificationSent,
    };

  } catch (error) {
    if (
      credential?.user &&
      secondaryAuth.currentUser?.uid === credential.user.uid
    ) {
      try {
        await deleteUser(credential.user);
      } catch (cleanupError) {
        console.error('Sub Admin account cleanup failed:', cleanupError);
      }
    }

    throw error;

  } finally {
    await signOut(secondaryAuth).catch((error) => {
      console.error('Secondary authentication sign-out failed:', error);
    });
  }
};

// ==========================================
// GET ALL SUB ADMINS
// ==========================================

export const getSubAdmins = async () => {
  verifySuperAdmin();

  const snapshot = await getDocs(subAdminCollection);

  return snapshot.docs.map((item) => ({
    ...item.data(),
    uid: item.id,
  }));
};

// ==========================================
// UPDATE SUB ADMIN PERMISSIONS
// ==========================================

export const updateSubAdminPermissions = async (
  subAdminUID,
  permissions
) => {
  verifySuperAdmin();

  if (!subAdminUID) {
    throw new Error('Sub Admin UID is required.');
  }

  const subAdminRef = doc(
    db,
    'ADMIN',
    SUPER_ADMIN_UID,
    'SUBADMIN',
    subAdminUID
  );

  const snapshot = await getDoc(subAdminRef);

  if (!snapshot.exists()) {
    throw new Error('Sub Admin not found.');
  }

  const role = snapshot.data().role;

  const updatedPermissions = normalizePermissions(
    role,
    permissions
  );

  await updateDoc(subAdminRef, {
    permissions: updatedPermissions,
    updatedAt: serverTimestamp(),
  });

  return updatedPermissions;
};

// ==========================================
// ACTIVATE / DEACTIVATE SUB ADMIN
// ==========================================

export const updateSubAdminStatus = async (
  subAdminUID,
  isActive
) => {
  verifySuperAdmin();

  if (!subAdminUID) {
    throw new Error('Sub Admin UID is required.');
  }

  if (typeof isActive !== 'boolean') {
    throw new Error('Invalid account status.');
  }

  const subAdminRef = doc(
    db,
    'ADMIN',
    SUPER_ADMIN_UID,
    'SUBADMIN',
    subAdminUID
  );

  await updateDoc(subAdminRef, {
    isActive,
    updatedAt: serverTimestamp(),
  });

  return isActive;
};
