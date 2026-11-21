
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  signInWithEmailAndPassword,
  signOut,
  reload,
  getIdToken,
} from 'firebase/auth';

import {
  doc,
  getDoc,
} from 'firebase/firestore';

import Button from '../Components/Button';
import { logoImage } from '../data/products';
import { auth, db } from '../firebase';

import './AdminLogin.css';

import { Eye, EyeOff } from 'lucide-react';

const ADMIN_EMAIL = 'dbestmalaika@gmail.com';
const SUPER_ADMIN_UID = 'sDbSHVhgrmcPfLv0PJP2QDfLKFp1';

const AdminLogin = () => {
  const [loginType, setLoginType] = useState('admin');

  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ==========================================
  // LOGIN TYPE
  // ==========================================

  const handleLoginTypeChange = (type) => {
    setLoginType(type);
    setEmail(type === 'admin' ? ADMIN_EMAIL : '');
    setPassword('');
    setError('');
    setShowPassword(false);
  };

  // ==========================================
  // SUPER ADMIN LOGIN
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

    navigate('/admin/dashboard', { replace: true });
  };

  // ==========================================
  // SUB ADMIN LOGIN
  // ==========================================

  const handleSubAdminLogin = async (user) => {
    const subAdminRef = doc(
      db,
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
      subAdminData.role === 'productManager' &&
      subAdminData.isActive === true;

    if (!authorized) {
      throw new Error(
        'Your Sub Admin account is inactive or not authorized.'
      );
    }

    // Get assigned permissions
    const permissions = subAdminData.permissions || {};

    // Redirect according to permissions
    if (permissions.viewProducts === true) {
      navigate('/admin/manage-products', {
        replace: true,
      });
      return;
    }

    if (permissions.addProduct === true) {
      navigate('/admin/add-product', {
        replace: true,
      });
      return;
    }

    throw new Error(
      'Your account has no product access permissions. Contact the Super Admin.'
    );
  };

  // ==========================================
  // LOGIN
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail || !password) {
        throw new Error(
          'Please enter your email and password.'
        );
      }

      if (
        loginType === 'admin' &&
        normalizedEmail !== ADMIN_EMAIL
      ) {
        throw new Error(
          'This email is not authorized for Super Admin access.'
        );
      }

      const credential = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );

      const user = credential.user;

      // Refresh email verification status
      await reload(user);

      if (!user.emailVerified) {
        await signOut(auth);

        throw new Error(
          'Please verify your email first. Check your Gmail inbox.'
        );
      }

      // Refresh Firebase ID token
      await getIdToken(user, true);

      // Select login pathway
      if (loginType === 'admin') {
        await handleSuperAdminLogin(user);
      } else {
        await handleSubAdminLogin(user);
      }

    } catch (authError) {
      console.error(
        'Admin authentication error:',
        authError
      );

      if (auth.currentUser) {
        await signOut(auth).catch(() => {});
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
  // UI
  // ==========================================

  return (
    <div className="page-shell admin-login-page">
      <div className="container admin-login-shell">
        <div className="admin-login-panel">

          <div className="admin-login-brand">
            <img
              src={logoImage}
              alt="SKINORA logo"
              className="admin-login-logo"
            />

            <div>
              <p className="eyebrow">Protected access</p>
              <h1>Admin Portal</h1>
            </div>
          </div>

          {/* LOGIN TYPE SELECTION */}

          <div className="admin-login-type">
            <button
              type="button"
              className={
                loginType === 'admin' ? 'active' : ''
              }
              onClick={() =>
                handleLoginTypeChange('admin')
              }
              disabled={loading}
            >
              Super Admin
            </button>

            <button
              type="button"
              className={
                loginType === 'subadmin' ? 'active' : ''
              }
              onClick={() =>
                handleLoginTypeChange('subadmin')
              }
              disabled={loading}
            >
              Sub Admin
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="admin-login-form"
          >

            <label>
              <span>
                {loginType === 'admin'
                  ? 'Super Admin email'
                  : 'Sub Admin email'}
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
                  loading || loginType === 'admin'
                }
              />
            </label>

            <label>
              <span>Password</span>

              <div className="admin-password-wrapper">
                <input
                  type={
                    showPassword ? 'text' : 'password'
                  }
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

            {error && (
              <p
                className="admin-auth-error"
                role="alert"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              className="full-width"
              disabled={loading}
            >
              {loading
                ? 'Please wait...'
                : loginType === 'admin'
                  ? 'Super Admin Login'
                  : 'Sub Admin Login'}
            </Button>

          </form>

          <div className="admin-login-footer">
            <Link to="/">Return to store</Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
