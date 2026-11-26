
import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import { auth, secondaryAuth, db, secondaryDb } from '../firebase';
import { getAdminStatus } from '../services/authService';
import { AuthContext } from './AuthContextValue';

const SUPER_ADMIN_UID = 'sDbSHVhgrmcPfLv0PJP2QDfLKFp1';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [customerUser, setCustomerUser] = useState(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mainUser = null;
    let subAdminUser = null;

    let mainReady = false;
    let secondaryReady = false;

    let checkId = 0;

    const verifySessions = async () => {
      if (!mainReady || !secondaryReady) return;

      const currentCheck = ++checkId;

      // =====================================
      // CUSTOMER SESSION - MAIN AUTH
      // =====================================

      const isSuperAdmin =
        mainUser?.uid === SUPER_ADMIN_UID;

      const verifiedCustomer =
        mainUser && !isSuperAdmin ? mainUser : null;

      setCustomerUser(verifiedCustomer);

      // =====================================
      // SUPER ADMIN - MAIN AUTH
      // =====================================

      if (isSuperAdmin) {
        try {
          const mainStatus = await getAdminStatus(
            mainUser,
            db
          );

          if (currentCheck !== checkId) return;

          if (mainStatus.isAdmin) {
            setUser(mainUser);
            setIsAdmin(true);
            setRole(mainStatus.role || 'admin');
            setPermissions(mainStatus.permissions || {});
            setError('');
            setLoading(false);
            return;
          }
        } catch (mainError) {
          console.error(
            'Main Admin verification failed:',
            mainError
          );
        }
      }

      // =====================================
      // SUB ADMIN - SECONDARY AUTH
      // =====================================

      if (subAdminUser) {
        try {
          const subAdminStatus = await getAdminStatus(
            subAdminUser,
            secondaryDb
          );

          if (currentCheck !== checkId) return;

          if (subAdminStatus.isAdmin) {
            setUser(subAdminUser);
            setIsAdmin(true);
            setRole(subAdminStatus.role || null);
            setPermissions(
              subAdminStatus.permissions || {}
            );
            setError('');
            setLoading(false);
            return;
          }
        } catch (secondaryError) {
          console.error(
            'Sub Admin verification failed:',
            secondaryError
          );
        }
      }

      // =====================================
      // NO ADMIN SESSION
      // =====================================

      if (currentCheck !== checkId) return;

      setUser(mainUser || null);
      setIsAdmin(false);
      setRole(null);
      setPermissions({});
      setError('');
      setLoading(false);
    };

    // =====================================
    // MAIN AUTH LISTENER
    // =====================================

    const unsubscribeMain = onAuthStateChanged(
      auth,
      (nextUser) => {
        mainUser = nextUser;
        mainReady = true;

        setLoading(true);
        verifySessions();
      }
    );

    // =====================================
    // SECONDARY AUTH LISTENER
    // =====================================

    const unsubscribeSecondary = onAuthStateChanged(
      secondaryAuth,
      (nextUser) => {
        subAdminUser = nextUser;
        secondaryReady = true;

        setLoading(true);
        verifySessions();
      }
    );

    // =====================================
    // CLEANUP
    // =====================================

    return () => {
      checkId++;

      unsubscribeMain();
      unsubscribeSecondary();
    };
  }, []);

  // =====================================
  // AUTH CONTEXT VALUE
  // =====================================

  const value = useMemo(
    () => ({
      user,
      customerUser,
      isAdmin,
      role,
      permissions,
      loading,
      error,
    }),
    [
      user,
      customerUser,
      isAdmin,
      role,
      permissions,
      loading,
      error,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
