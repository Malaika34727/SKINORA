
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
    permissions = {},
    setSelectedPanel,
  } = useAuth();

  const isSuperAdmin =
    role === 'admin' &&
    selectedPanel === 'superAdmin';

  const isOrderManager =
    !isSuperAdmin &&
    (
      selectedPanel === 'orderManager' ||
      role === 'orderManager' ||
      (
        permissions.viewOrders === true &&
        permissions.viewProducts !== true
      )
    );

  const panelTitle = isSuperAdmin
    ? 'SUPER ADMINISTRATION'
    : isOrderManager
      ? 'Order Manager'
      : selectedPanel === 'productManager'
        ? 'Product Manager'
        : 'Sub Admin Panel';

  const welcomeTitle = isSuperAdmin
    ? 'Welcome back, Admin'
    : isOrderManager
      ? 'Welcome back, Order Manager'
      : selectedPanel === 'productManager'
        ? 'Welcome back, Product Manager'
        : 'Welcome back, Sub Admin';

  const handleLogout = async () => {
    setError('');

    const selectedAuth =
      selectedPanel === 'superAdmin'
        ? superAdminAuth
        : secondaryAuth;

    try {
      await signOut(selectedAuth);
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

  const headerClass = [
  'admin-header',
  isSuperAdmin || !isSuperAdmin ? 'super-admin-header' : '',
]
  .filter(Boolean)
  .join(' ');
  return (
    <header className={headerClass}>
      <div className="admin-header-shell">

        <div className="admin-header-brand">
          {isSuperAdmin && (
            <span className="super-admin-brand-mark">
              S
            </span>
          )}

          <div className="admin-header-heading">
            <p className="admin-header-kicker">
              {panelTitle}
            </p>

            <h2>{welcomeTitle}</h2>

            {isSuperAdmin && (
              <p className="super-admin-subtitle">
                Your workspace. Your control.
              </p>
            )}
          </div>
        </div>

        <div className="admin-header-actions">

          <Link
            to="/"
            className="admin-link-button"
          >
            <span>View Store</span>
            <span className="header-button-arrow">↗</span>
          </Link>

          <button
            type="button"
            className="admin-link-button danger"
            onClick={handleLogout}
          >
            <span>Logout</span>
            <span className="header-logout-icon">↗</span>
          </button>

        </div>
      </div>

      {error && (
        <p
          className="admin-header-error"
          role="alert"
        >
          {error}
        </p>
      )}
    </header>
  );
};

export default AdminNavbar;
