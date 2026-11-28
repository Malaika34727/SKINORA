
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { onAuthStateChanged } from 'firebase/auth';

import {
  auth,
  superAdminAuth,
  secondaryAuth,
  db,
  superAdminDb,
  secondaryDb,
} from '../firebase';

import { getAdminStatus } from '../services/authService';
import { AuthContext } from './AuthContextValue';

const SUPER_ADMIN_UID = 'sDbSHVhgrmcPfLv0PJP2QDfLKFp1';

const ACTIVE_PANEL_KEY = 'skinora_active_admin_panel';

const VALID_PANELS = [
  'superAdmin',
  'productManager',
  'orderManager',
];

const PANEL_PERMISSIONS = {
  productManager: [
    'viewProducts',
    'addProduct',
    'updateProduct',
    'deleteProduct',
    'importProducts',
  ],

  orderManager: [
    'viewOrders',
    'updateOrderStatus',
    'verifyPayments',
  ],
};

// ==========================================
// GET SAVED PANEL
// ==========================================

const getSavedPanel = () => {
  try {
    const saved = sessionStorage.getItem(ACTIVE_PANEL_KEY);

    return VALID_PANELS.includes(saved) ? saved : null;
  } catch {
    return null;
  }
};

// ==========================================
// AUTH PROVIDER
// ==========================================

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [customerUser, setCustomerUser] = useState(null);

  const [isAdmin, setIsAdmin] = useState(false);

  const [role, setRole] = useState(null);

  const [permissions, setPermissions] = useState({});

  const [selectedPanelState, setSelectedPanelState] = useState(
    getSavedPanel
  );

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const selectedPanel = selectedPanelState;

  // ==========================================
  // SELECT ADMIN PANEL
  // ==========================================

  const setSelectedPanel = useCallback((panel) => {
    const validPanel = VALID_PANELS.includes(panel)
      ? panel
      : null;

    try {
      if (validPanel) {
        sessionStorage.setItem(
          ACTIVE_PANEL_KEY,
          validPanel
        );
      } else {
        sessionStorage.removeItem(ACTIVE_PANEL_KEY);
      }
    } catch (storageError) {
      console.error(
        'Panel storage error:',
        storageError
      );
    }

    // Reset verification only when panel changes.
    if (validPanel !== selectedPanelState) {
      setLoading(true);

      setError('');

      setUser(null);

      setIsAdmin(false);

      setRole(null);

      setPermissions({});
    }

    setSelectedPanelState(validPanel);
  }, [selectedPanelState]);

  // ==========================================
  // AUTHENTICATION LISTENERS
  // ==========================================

  useEffect(() => {
    let customerAuthUser = null;

    let superAdminUser = null;

    let subAdminUser = null;

    let customerReady = false;

    let superAdminReady = false;

    let subAdminReady = false;

    let active = true;

    let checkId = 0;

    // ======================================
    // CLEAR ADMIN STATE
    // ======================================

    const clearAdminState = () => {
      setUser(null);

      setIsAdmin(false);

      setRole(null);

      setPermissions({});
    };

    // ======================================
    // VERIFY ALL SESSIONS
    // ======================================

    const verifySessions = async () => {
      if (
        !active ||
        !customerReady ||
        !superAdminReady ||
        !subAdminReady
      ) {
        return;
      }

      const currentCheck = ++checkId;

      setLoading(true);

      setError('');

      // Customer session remains independent.
      setCustomerUser(
        customerAuthUser?.uid === SUPER_ADMIN_UID
          ? null
          : customerAuthUser
      );

      // ======================================
      // NO ADMIN PANEL SELECTED
      // ======================================

      if (!selectedPanel) {
        clearAdminState();

        if (active && currentCheck === checkId) {
          setLoading(false);
        }

        return;
      }

      // ======================================
      // SUPER ADMIN VERIFICATION
      // ======================================

      if (selectedPanel === 'superAdmin') {
        try {
          if (
            !superAdminUser ||
            superAdminUser.uid !== SUPER_ADMIN_UID
          ) {
            throw new Error(
              'Super Admin session is not active.'
            );
          }

          // Verify Super Admin using SuperAdminApp Firestore.
          const status = await getAdminStatus(
            superAdminUser,
            superAdminDb
          );

          if (!active || currentCheck !== checkId) {
            return;
          }

          if (!status?.isAdmin) {
            throw new Error(
              status?.error ||
              'Super Admin access could not be verified.'
            );
          }

          setUser(superAdminUser);

          setIsAdmin(true);

          setRole('admin');

          setPermissions(status.permissions || {});

          setError('');
        } catch (verificationError) {
          if (!active || currentCheck !== checkId) {
            return;
          }

          clearAdminState();

          setError(
            verificationError.message ||
            'Super Admin verification failed.'
          );
        }

        if (active && currentCheck === checkId) {
          setLoading(false);
        }

        return;
      }

      // ======================================
      // SUB ADMIN VERIFICATION
      // ======================================

      if (
        selectedPanel === 'productManager' ||
        selectedPanel === 'orderManager'
      ) {
        try {
          if (!subAdminUser) {
            throw new Error(
              'Sub Admin session is not active.'
            );
          }

          // Sub Admin continues using SecondaryApp Firestore.
          const status = await getAdminStatus(
            subAdminUser,
            secondaryDb
          );

          if (!active || currentCheck !== checkId) {
            return;
          }

          if (!status?.isAdmin) {
            throw new Error(
              status?.error ||
              'Sub Admin access could not be verified.'
            );
          }

          const userPermissions = status.permissions || {};

          const allowedPermissions =
            PANEL_PERMISSIONS[selectedPanel];

          const hasPanelAccess = allowedPermissions.some(
            (permission) =>
              userPermissions[permission] === true
          );

          if (!hasPanelAccess) {
            throw new Error(
              'Your account does not have permission for this panel.'
            );
          }

          if (
            selectedPanel === 'orderManager' &&
            userPermissions.viewOrders !== true
          ) {
            throw new Error(
              'You do not have permission to view orders.'
            );
          }

          setUser(subAdminUser);

          setIsAdmin(true);

          setRole(status.role || 'subadmin');

          setPermissions(userPermissions);

          setError('');
        } catch (verificationError) {
          if (!active || currentCheck !== checkId) {
            return;
          }

          clearAdminState();

          setError(
            verificationError.message ||
            'Sub Admin verification failed.'
          );
        }

        if (active && currentCheck === checkId) {
          setLoading(false);
        }
      }
    };

    // ==========================================
    // CUSTOMER AUTH LISTENER
    // ==========================================

    const unsubscribeCustomer = onAuthStateChanged(
      auth,
      (nextUser) => {
        customerAuthUser = nextUser;

        customerReady = true;

        verifySessions();
      }
    );

    // ==========================================
    // SUPER ADMIN AUTH LISTENER
    // ==========================================

    const unsubscribeSuperAdmin = onAuthStateChanged(
      superAdminAuth,
      (nextUser) => {
        superAdminUser = nextUser;

        superAdminReady = true;

        verifySessions();
      }
    );

    // ==========================================
    // SUB ADMIN AUTH LISTENER
    // ==========================================

    const unsubscribeSubAdmin = onAuthStateChanged(
      secondaryAuth,
      (nextUser) => {
        subAdminUser = nextUser;

        subAdminReady = true;

        verifySessions();
      }
    );

    // ==========================================
    // CLEANUP
    // ==========================================

    return () => {
      active = false;

      checkId++;

      unsubscribeCustomer();

      unsubscribeSuperAdmin();

      unsubscribeSubAdmin();
    };
  }, [selectedPanel]);

  // ==========================================
  // CONTEXT VALUE
  // ==========================================

  const value = useMemo(
    () => ({
      user,
      customerUser,
      isAdmin,
      role,
      permissions,
      selectedPanel,
      setSelectedPanel,
      loading,
      error,
    }),
    [
      user,
      customerUser,
      isAdmin,
      role,
      permissions,
      selectedPanel,
      setSelectedPanel,
      loading,
      error,
    ]
  );

  // ==========================================
  // PROVIDER
  // ==========================================

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
