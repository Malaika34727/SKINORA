
import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '../firebase';
import { getAdminStatus } from '../services/authService';

const AdminRoute = ({
  children,
  requiredPermission,
}) => {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setStatus('loading');

      if (!user) {
        setStatus('unauthorized');
        return;
      }

      try {
        const adminStatus = await getAdminStatus(user);

        // Ignore outdated authentication responses.
        if (auth.currentUser?.uid !== user.uid) return;

        if (!adminStatus.isAdmin) {
          setStatus('unauthorized');
          return;
        }

        // Super Admin can access every admin page.
        if (adminStatus.role === 'admin') {
          setStatus('authorized');
          return;
        }

        // Sub Admin must have the required permission.
        if (
          adminStatus.role === 'productManager' &&
          requiredPermission &&
          adminStatus.permissions?.[requiredPermission] === true
        ) {
          setStatus('authorized');
          return;
        }

        // Sub Admin cannot access Super Admin pages.
        setStatus('forbidden');

      } catch (error) {
        console.error('Admin verification failed:', error);

        if (auth.currentUser?.uid === user.uid) {
          setStatus('unauthorized');
        }
      }
    });

    return () => unsubscribe();
  }, [requiredPermission]);

  // Loading
  if (status === 'loading') {
    return (
      <div className="page-shell">
        Verifying administrator access...
      </div>
    );
  }

  // Not logged in or unauthorized
  if (status === 'unauthorized') {
    return <Navigate to="/skinora-admin" replace />;
  }

  // Logged in but permission not granted
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
