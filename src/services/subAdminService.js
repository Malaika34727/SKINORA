
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

import {
  superAdminAuth,
  superAdminDb,
  secondaryAuth,
} from '../firebase';

// ==========================================
// SUPER ADMIN UID
// ==========================================

const SUPER_ADMIN_UID = 'sDbSHVhgrmcPfLv0PJP2QDfLKFp1';

// ==========================================
// SUB ADMIN COLLECTION
// Use Super Admin Firestore instance
// ==========================================

const subAdminCollection = collection(
  superAdminDb,
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
// ALL AVAILABLE PERMISSIONS
// ==========================================

const allPermissions = {
  viewProducts: false,
  addProduct: false,
  updateProduct: false,
  deleteProduct: false,
  importProducts: false,

  viewOrders: false,
  updateOrderStatus: false,
  verifyPayments: false,
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
  if (superAdminAuth.currentUser?.uid !== SUPER_ADMIN_UID) {
    throw new Error(
      'Only the Super Admin can manage Sub Admins.'
    );
  }
};

// ==========================================
// NORMALIZE PERMISSIONS
// ==========================================

const normalizePermissions = (permissions = {}) => {
  const normalized = {};

  Object.keys(allPermissions).forEach((permission) => {
    normalized[permission] =
      permissions[permission] === true;
  });

  return normalized;
};

// ==========================================
// GET ASSIGNED PANELS
// ==========================================

export const getAssignedPanels = (permissions = {}) => {
  const panels = [];

  const productPermissionKeys = [
    'viewProducts',
    'addProduct',
    'updateProduct',
    'deleteProduct',
    'importProducts',
  ];

  const orderPermissionKeys = [
    'viewOrders',
    'updateOrderStatus',
    'verifyPayments',
  ];

  const hasProductPermissions =
    productPermissionKeys.some(
      (key) => permissions[key] === true
    );

  const hasOrderPermissions =
    orderPermissionKeys.some(
      (key) => permissions[key] === true
    );

  if (hasProductPermissions) {
    panels.push('Product Manager');
  }

  if (hasOrderPermissions) {
    panels.push('Order Manager');
  }

  return panels;
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
    throw new Error(
      'Password must contain at least 6 characters.'
    );
  }

  const configuration = roleConfiguration[role];

  if (!configuration) {
    throw new Error('Invalid Sub Admin role.');
  }

  const safePermissions = normalizePermissions({
    ...allPermissions,
    ...configuration.permissions,
    ...permissions,
  });

  const assignedPanels = getAssignedPanels(
    safePermissions
  );

  if (assignedPanels.length === 0) {
    throw new Error(
      'Please assign at least one panel permission.'
    );
  }

  let credential = null;

  try {
    // Create Sub Admin account using separate Auth
    credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      normalizedEmail,
      password
    );

    const subAdmin = credential.user;

    // Save Sub Admin record using Super Admin Firestore
    const subAdminRef = doc(
      superAdminDb,
      'ADMIN',
      SUPER_ADMIN_UID,
      'SUBADMIN',
      subAdmin.uid
    );

    await setDoc(subAdminRef, {
      uid: subAdmin.uid,
      email: normalizedEmail,

      // Legacy role fields
      role,
      roleLabel: configuration.label,

      // Permissions
      permissions: safePermissions,

      // Account information
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

      console.error(
        'Verification email could not be sent:',
        emailError
      );
    }

    return {
      uid: subAdmin.uid,
      email: normalizedEmail,
      role,
      permissions: safePermissions,
      assignedPanels,
      verificationSent,
    };
  } catch (error) {
    // Cleanup partially created account
    if (
      credential?.user &&
      secondaryAuth.currentUser?.uid === credential.user.uid
    ) {
      try {
        await deleteUser(credential.user);
      } catch (cleanupError) {
        console.error(
          'Sub Admin account cleanup failed:',
          cleanupError
        );
      }
    }

    throw error;
  } finally {
    // Sign out only Secondary Auth
    await signOut(secondaryAuth).catch((error) => {
      console.error(
        'Secondary authentication sign-out failed:',
        error
      );
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
    superAdminDb,
    'ADMIN',
    SUPER_ADMIN_UID,
    'SUBADMIN',
    subAdminUID
  );

  const snapshot = await getDoc(subAdminRef);

  if (!snapshot.exists()) {
    throw new Error('Sub Admin not found.');
  }

  const existingPermissions =
    snapshot.data().permissions || {};

  const mergedPermissions = {
    ...existingPermissions,
    ...permissions,
  };

  const updatedPermissions = normalizePermissions(
    mergedPermissions
  );

  const assignedPanels = getAssignedPanels(
    updatedPermissions
  );

  if (assignedPanels.length === 0) {
    throw new Error(
      'A Sub Admin must have at least one panel assigned.'
    );
  }

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
    superAdminDb,
    'ADMIN',
    SUPER_ADMIN_UID,
    'SUBADMIN',
    subAdminUID
  );

  const snapshot = await getDoc(subAdminRef);

  if (!snapshot.exists()) {
    throw new Error('Sub Admin not found.');
  }

  await updateDoc(subAdminRef, {
    isActive,
    updatedAt: serverTimestamp(),
  });

  return isActive;
};
