
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';

import {
  superAdminAuth,
  secondaryAuth,
} from '../firebase';

import { useAuth } from '../context/AuthContextValue';

import './AdminNavbar.css';

const AdminNavbar = () => {
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const {
    role,
    selectedPanel,
    setSelectedPanel,
  } = useAuth();

  const isSuperAdmin =
    role === 'admin' &&
    selectedPanel === 'superAdmin';

  const panelTitle = isSuperAdmin
    ? 'Dashboard'
    : selectedPanel === 'productManager'
      ? 'Product Manager'
      : selectedPanel === 'orderManager'
        ? 'Order Manager'
        : 'Sub Admin Panel';

  const welcomeTitle = isSuperAdmin
    ? 'Welcome back, Admin'
    : selectedPanel === 'productManager'
      ? 'Welcome back, Product Manager'
      : selectedPanel === 'orderManager'
        ? 'Welcome back, Order Manager'
        : 'Welcome back, Sub Admin';

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = async () => {
    setError('');

    const selectedAuth =
      selectedPanel === 'superAdmin'
        ? superAdminAuth
        : secondaryAuth;

    try {
      // Only sign out the currently selected admin session.
      await signOut(selectedAuth);

      // Clear this tab's selected admin panel.
      setSelectedPanel(null);

      navigate('/skinora-admin', {
        replace: true,
      });
    } catch (logoutError) {
      console.error('Admin logout error:', logoutError);

      setError(
        logoutError.message || 'Could not sign out.'
      );
    }
  };

  return (
    <header className="admin-header">
      <div className="admin-header-shell">
        <div>
          <p className="admin-header-kicker">
            {panelTitle}
          </p>

          <h2>{welcomeTitle}</h2>
        </div>

        <div className="admin-header-actions">
          <Link
            to="/"
            className="admin-link-button"
          >
            View Store
          </Link>

          <button
            type="button"
            className="admin-link-button danger"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      {error && (
        <p role="alert">
          {error}
        </p>
      )}
    </header>
  );
};

export default AdminNavbar;
