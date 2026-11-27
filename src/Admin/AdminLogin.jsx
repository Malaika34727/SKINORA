
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  signInWithEmailAndPassword,
  signOut,
  reload,
  getIdToken,
  setPersistence,
  browserSessionPersistence,
} from 'firebase/auth';

import {
  doc,
  getDoc,
} from 'firebase/firestore';

import Button from '../Components/Button';
import { logoImage } from '../data/products';

import {
  superAdminAuth,
  secondaryAuth,
  db,
  secondaryDb,
} from '../firebase';

import { useAuth } from '../context/AuthContextValue';

import './AdminLogin.css';

import { Eye, EyeOff } from 'lucide-react';

const ADMIN_EMAIL = 'dbestmalaika@gmail.com';

const SUPER_ADMIN_UID = 'sDbSHVhgrmcPfLv0PJP2QDfLKFp1';

const VALID_ROLES = [
  'admin',
  'productManager',
  'orderManager',
];

const AdminLogin = ({ initialRole = 'admin' }) => {
  const [selectedRole, setSelectedRole] = useState(
    VALID_ROLES.includes(initialRole)
      ? initialRole
      : 'admin'
  );

  const [email, setEmail] = useState(
    initialRole === 'admin' ? ADMIN_EMAIL : ''
  );

  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const { setSelectedPanel } = useAuth();

  // ==========================================
  // SYNC ROLE WITH URL
  // ==========================================

  useEffect(() => {
    const role = VALID_ROLES.includes(initialRole)
      ? initialRole
      : 'admin';

    setSelectedRole(role);

    setEmail(role === 'admin' ? ADMIN_EMAIL : '');

    setPassword('');

    setError('');

    setShowPassword(false);
  }, [initialRole]);

  // ==========================================
  // ROLE DROPDOWN
  // ==========================================

  const handleRoleChange = (role) => {
    if (!VALID_ROLES.includes(role)) return;

    setSelectedRole(role);

    setEmail(role === 'admin' ? ADMIN_EMAIL : '');

    setPassword('');

    setError('');

    setShowPassword(false);
  };

  // ==========================================
  // SUPER ADMIN LOGIN VERIFICATION
  // ==========================================

  const handleSuperAdminLogin = async (user) => {
    if (
      user.uid !== SUPER_ADMIN_UID ||
      user.email?.trim().toLowerCase() !== ADMIN_EMAIL
    ) {
      throw new Error(
        'This email is not authorized for Super Admin access.'
      );
    }

    const adminRef = doc(
      db,
      'ADMIN',
      SUPER_ADMIN_UID
    );

    const adminSnapshot = await getDoc(adminRef);

    if (!adminSnapshot.exists()) {
      throw new Error(
        'Super Admin record was not found.'
      );
    }

    const adminData = adminSnapshot.data();

    const authorized =
      adminData.uid === SUPER_ADMIN_UID &&
      adminData.email?.trim().toLowerCase() === ADMIN_EMAIL &&
      adminData.role === 'admin' &&
      adminData.isActive === true;

    if (!authorized) {
      throw new Error(
        'This account is not authorized to access the admin panel.'
      );
    }

    setSelectedPanel('superAdmin');

    navigate('/admin/dashboard', {
      replace: true,
    });
  };

  // ==========================================
  // SUB ADMIN LOGIN VERIFICATION
  // ==========================================

  const handleSubAdminLogin = async (user) => {
    const subAdminRef = doc(
      secondaryDb,
      'ADMIN',
      SUPER_ADMIN_UID,
      'SUBADMIN',
      user.uid
    );

    const subAdminSnapshot = await getDoc(subAdminRef);

    if (!subAdminSnapshot.exists()) {
      throw new Error(
        'No Sub Admin account was found for this Gmail.'
      );
    }

    const subAdminData = subAdminSnapshot.data();

    const authorized =
      subAdminData.uid === user.uid &&
      subAdminData.email?.trim().toLowerCase() ===
        user.email?.trim().toLowerCase() &&
      subAdminData.isActive === true;

    if (!authorized) {
      throw new Error(
        'Your Sub Admin account is inactive or not authorized.'
      );
    }

    const permissions = subAdminData.permissions || {};

    // ==========================================
    // PRODUCT MANAGER
    // ==========================================

    if (selectedRole === 'productManager') {
      const hasProductAccess = [
        'viewProducts',
        'addProduct',
        'updateProduct',
        'deleteProduct',
        'importProducts',
      ].some(
        (permission) => permissions[permission] === true
      );

      if (!hasProductAccess) {
        throw new Error(
          'You do not have Product Manager permissions.'
        );
      }

      let destination = null;

      if (permissions.viewProducts === true) {
        destination = '/admin/manage-products';
      } else if (permissions.addProduct === true) {
        destination = '/admin/add-product';
      } else {
        throw new Error(
          'Your Product Manager account has no accessible starting page.'
        );
      }

      setSelectedPanel('productManager');

      navigate(destination, {
        replace: true,
      });

      return;
    }

    // ==========================================
    // ORDER MANAGER
    // ==========================================

    if (selectedRole === 'orderManager') {
      if (permissions.viewOrders !== true) {
        throw new Error(
          'You do not have permission to view orders.'
        );
      }

      setSelectedPanel('orderManager');

      navigate('/admin/orders', {
        replace: true,
      });

      return;
    }

    throw new Error('Invalid role selection.');
  };

  // ==========================================
  // LOGIN SUBMIT
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');

    setLoading(true);

    const isSuperAdmin = selectedRole === 'admin';

    const selectedAuth = isSuperAdmin
      ? superAdminAuth
      : secondaryAuth;

    let signedInUser = null;

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail || !password) {
        throw new Error(
          'Please enter your email and password.'
        );
      }

      if (
        isSuperAdmin &&
        normalizedEmail !== ADMIN_EMAIL
      ) {
        throw new Error(
          'This email is not authorized for Super Admin access.'
        );
      }

      // ==========================================
      // TAB-SPECIFIC SESSION PERSISTENCE
      // ==========================================

      await setPersistence(
        selectedAuth,
        browserSessionPersistence
      );

      // ==========================================
      // FIREBASE SIGN IN
      // ==========================================

      const credential = await signInWithEmailAndPassword(
        selectedAuth,
        normalizedEmail,
        password
      );

      signedInUser = credential.user;

      await reload(signedInUser);

      if (!signedInUser.emailVerified) {
        throw new Error(
          'Please verify your email first. Check your Gmail inbox.'
        );
      }

      await getIdToken(signedInUser, true);

      // ==========================================
      // ROLE AUTHORIZATION
      // ==========================================

      if (isSuperAdmin) {
        await handleSuperAdminLogin(signedInUser);
      } else {
        await handleSubAdminLogin(signedInUser);
      }
    } catch (authError) {
      console.error(
        'Admin authentication error:',
        authError
      );

      // Sign out only the account authenticated by this attempt.

      if (
        signedInUser &&
        selectedAuth.currentUser?.uid === signedInUser.uid
      ) {
        await signOut(selectedAuth).catch((signOutError) => {
          console.error(
            'Could not clean up failed admin login:',
            signOutError
          );
        });
      }

      switch (authError.code) {
        case 'auth/invalid-credential':
          setError('Incorrect email or password.');
          break;

        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;

        case 'auth/user-disabled':
          setError(
            'This Firebase account has been disabled.'
          );
          break;

        case 'permission-denied':
        case 'firestore/permission-denied':
          setError(
            'Firestore permission denied. Please check your security rules.'
          );
          break;

        default:
          setError(
            authError.message || 'Authentication failed.'
          );
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOGIN UI
  // ==========================================

  return (
    <div className="page-shell admin-login-page">
      <div className="container admin-login-shell">
        <div className="admin-login-panel">

          {/* BRAND */}

          <div className="admin-login-brand">
            <img
              src={logoImage}
              alt="SKINORA logo"
              className="admin-login-logo"
            />

            <div>
              <p className="eyebrow">
                Protected access
              </p>

              <h1>Admin Portal</h1>
            </div>
          </div>

          {/* LOGIN FORM */}

          <form
            onSubmit={handleSubmit}
            className="admin-login-form"
          >
            {/* ROLE */}

            <label>
              <span>Select your role</span>

              <select
                value={selectedRole}
                onChange={(event) =>
                  handleRoleChange(event.target.value)
                }
                disabled={loading}
                required
              >
                <option value="admin">
                  Super Admin
                </option>

                <option value="productManager">
                  Product Manager
                </option>

                <option value="orderManager">
                  Order Manager
                </option>
              </select>
            </label>

            {/* EMAIL */}

            <label>
              <span>
                {selectedRole === 'admin'
                  ? 'Super Admin email'
                  : selectedRole === 'productManager'
                    ? 'Product Manager email'
                    : 'Order Manager email'}
              </span>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Enter your Gmail"
                autoComplete="username"
                required
                disabled={
                  loading || selectedRole === 'admin'
                }
              />
            </label>

            {/* PASSWORD */}

            <label>
              <span>Password</span>

              <div className="admin-password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </label>

            {/* ERROR */}

            {error && (
              <p
                className="admin-auth-error"
                role="alert"
              >
                {error}
              </p>
            )}

            {/* LOGIN BUTTON */}

            <Button
              type="submit"
              variant="primary"
              className="full-width"
              disabled={loading}
            >
              {loading
                ? 'Please wait...'
                : selectedRole === 'admin'
                  ? 'Super Admin Login'
                  : selectedRole === 'productManager'
                    ? 'Product Manager Login'
                    : 'Order Manager Login'}
            </Button>
          </form>

          {/* FOOTER */}

          <div className="admin-login-footer">
            <Link to="/">
              Return to store
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
