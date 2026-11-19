import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { getAdminStatus } from '../services/authService';
import { AuthContext } from './AuthContextValue';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => onAuthStateChanged(auth, async (nextUser) => {
    setUser(nextUser);
    setIsAdmin(false);
    setError('');

    if (!nextUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const adminStatus = await getAdminStatus(nextUser);
      if (auth.currentUser?.uid === nextUser.uid) {
        setIsAdmin(adminStatus.isAdmin);
        if (adminStatus.source === 'error') {
          setError('Could not verify administrator access. Check your Firebase connection and admin rules.');
        }
      }
    } catch (authError) {
      if (auth.currentUser?.uid === nextUser.uid) {
        setError(`Could not verify administrator access: ${authError.message}`);
      }
    } finally {
      if (auth.currentUser?.uid === nextUser.uid) {
        setLoading(false);
      }
    }
  }), []);

  const value = useMemo(() => ({ user, isAdmin, loading, error }), [user, isAdmin, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
