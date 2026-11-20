
import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { auth, db } from '../firebase';

const AdminRoute = ({ children }) => {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setStatus('unauthorized');
        return;
      }

      try {
        await user.reload();

        if (!user.emailVerified) {
          setStatus('unauthorized');
          return;
        }

        const adminRef = doc(db, 'ADMIN', user.uid);
        const adminSnapshot = await getDoc(adminRef);

        if (!adminSnapshot.exists()) {
          setStatus('unauthorized');
          return;
        }

        const adminData = adminSnapshot.data();

        const isAuthorized =
          user.email?.toLowerCase() === 'dbestmalaika@gmail.com' &&
          adminData.email?.toLowerCase() === 'dbestmalaika@gmail.com' &&
          adminData.role === 'admin' &&
          adminData.isActive === true;

        setStatus(isAuthorized ? 'authorized' : 'unauthorized');

      } catch (error) {
        console.error('Admin verification failed:', error);
        setStatus('unauthorized');
      }
    });

    return () => unsubscribe();
  }, []);

  if (status === 'loading') {
    return (
      <div className="page-shell">
        Verifying admin access...
      </div>
    );
  }

  if (status !== 'authorized') {
    return <Navigate to="/skinora-admin" replace />;
  }

  return children || <Outlet />;
};

export default AdminRoute;
