
import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import {
  auth,
  secondaryAuth,
  db,
  secondaryDb,
} from '../firebase';

const SUPER_ADMIN_UID = 'sDbSHVhgrmcPfLv0PJP2QDfLKFp1';
const SUPER_ADMIN_EMAIL = 'dbestmalaika@gmail.com';

const AdminRoute = ({
  children,
  requiredPermission,
}) => {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let mainUser = null;
    let secondaryUser = null;

    let mainReady = false;
    let secondaryReady = false;
    let active = true;

    const verifyAccess = async () => {
      if (!mainReady || !secondaryReady || !active) return;

      setStatus('loading');

      try {
        // ==========================================
        // SUPER ADMIN - MAIN AUTH
        // ==========================================

        if (
          mainUser &&
          mainUser.uid === SUPER_ADMIN_UID &&
          mainUser.email?.trim().toLowerCase() ===
            SUPER_ADMIN_EMAIL
        ) {
          const adminRef = doc(
            db,
            'ADMIN',
            SUPER_ADMIN_UID
          );

          const adminSnapshot = await getDoc(adminRef);

          if (!active) return;

          if (adminSnapshot.exists()) {
            const adminData = adminSnapshot.data();

            const isAuthorized =
              adminData.uid === SUPER_ADMIN_UID &&
              adminData.email?.trim().toLowerCase() ===
                SUPER_ADMIN_EMAIL &&
              adminData.role === 'admin' &&
              adminData.isActive === true;

            if (isAuthorized) {
              setStatus('authorized');
              return;
            }
          }
        }

        // ==========================================
        // SUB ADMIN - SECONDARY AUTH
        // ==========================================

        if (secondaryUser) {
          const subAdminRef = doc(
            secondaryDb,
            'ADMIN',
            SUPER_ADMIN_UID,
            'SUBADMIN',
            secondaryUser.uid
          );

          const subAdminSnapshot = await getDoc(
            subAdminRef
          );

          if (!active) return;

          if (subAdminSnapshot.exists()) {
            const subAdminData = subAdminSnapshot.data();

            const isAuthorized =
              subAdminData.uid === secondaryUser.uid &&
              subAdminData.email?.trim().toLowerCase() ===
                secondaryUser.email?.trim().toLowerCase() &&
              subAdminData.role === 'productManager' &&
              subAdminData.isActive === true;

            if (isAuthorized) {
              const permissions =
                subAdminData.permissions || {};

              if (
                requiredPermission &&
                permissions[requiredPermission] === true
              ) {
                setStatus('authorized');
                return;
              }

              setStatus('forbidden');
              return;
            }
          }
        }

        // Neither valid admin session
        setStatus('unauthorized');

      } catch (error) {
        console.error(
          'Admin verification failed:',
          error
        );

        if (active) {
          setStatus('unauthorized');
        }
      }
    };

    // Listen to Main Authentication
    const unsubscribeMain = onAuthStateChanged(
      auth,
      (user) => {
        mainUser = user;
        mainReady = true;
        verifyAccess();
      }
    );

    // Listen to Secondary Authentication
    const unsubscribeSecondary = onAuthStateChanged(
      secondaryAuth,
      (user) => {
        secondaryUser = user;
        secondaryReady = true;
        verifyAccess();
      }
    );

    return () => {
      active = false;
      unsubscribeMain();
      unsubscribeSecondary();
    };
  }, [requiredPermission]);

  // ==========================================
  // LOADING
  // ==========================================

  if (status === 'loading') {
    return (
      <div className="page-shell">
        Verifying administrator access...
      </div>
    );
  }

  // ==========================================
  // UNAUTHORIZED
  // ==========================================

  if (status === 'unauthorized') {
    return <Navigate to="/skinora-admin" replace />;
  }

  // ==========================================
  // FORBIDDEN
  // ==========================================

  if (status === 'forbidden') {
    return (
      <main className="page-shell">
        <div
          className="container"
          style={{
            paddingBlock: '5rem',
            textAlign: 'center',
          }}
        >
          <p className="eyebrow">Access restricted</p>

          <h1>Permission Denied</h1>

          <p className="muted-copy">
            Your account does not have permission to access this page.
            Please contact the Super Admin.
          </p>
        </div>
      </main>
    );
  }

  return children || <Outlet />;
};

export default AdminRoute;