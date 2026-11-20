
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  reload,
  getIdToken,
} from 'firebase/auth';

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

import Button from '../Components/Button';
import { logoImage } from '../data/products';
import { auth, db } from '../firebase';
import './AdminLogin.css';
import { Eye, EyeOff } from 'lucide-react';

const ADMIN_EMAIL = 'dbestmalaika@gmail.com';

const AdminLogin = () => {
  const [email, setEmail] = useState('dbestmalaika@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // CREATE ADMIN ACCOUNT
  const handleRegister = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail !== ADMIN_EMAIL) {
      setError('This email is not authorized for admin registration.');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    const credential = await createUserWithEmailAndPassword(
      auth,
      normalizedEmail,
      password
    );

    await sendEmailVerification(credential.user);
    await signOut(auth);

    setPassword('');

    setMessage(
      'Admin account created successfully. Please verify your email through the link sent to your Gmail, then log in.'
    );
  };

  // ADMIN LOGIN
  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail !== ADMIN_EMAIL) {
      setError('This email is not authorized for admin access.');
      return;
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

      setError(
        'Please verify your admin email first. Check your Gmail inbox.'
      );
      return;
    }

    // Refresh Firebase ID token so Firestore receives updated claims
    await getIdToken(user, true);

    const adminRef = doc(db, 'ADMIN', user.uid);
    const adminSnapshot = await getDoc(adminRef);

    if (!adminSnapshot.exists()) {
      // Create the first admin document
      await setDoc(adminRef, {
        uid: user.uid,
        email: normalizedEmail,
        role: 'admin',
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const adminData = adminSnapshot.data();

      const authorized =
        adminData.email?.toLowerCase() === ADMIN_EMAIL &&
        adminData.role === 'admin' &&
        adminData.isActive === true;

      if (!authorized) {
        await signOut(auth);

        setError(
          'This account is not authorized to access the admin panel.'
        );
        return;
      }
    }

    navigate('/admin/dashboard', { replace: true });
  };

  // FORM SUBMISSION
  const handleSubmit = async (event, action) => {
    event.preventDefault();

    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (action === 'register') {
        await handleRegister();
      } else {
        await handleLogin();
      }
    } catch (authError) {
      console.error('Admin authentication error:', authError);

      // Sign out if an admin login attempt fails
      if (action === 'login' && auth.currentUser) {
        await signOut(auth).catch(() => {});
      }

      switch (authError.code) {
        case 'auth/email-already-in-use':
          setError('This admin account already exists. Please log in.');
          break;

        case 'auth/invalid-credential':
          setError('Incorrect email or password.');
          break;

        case 'auth/weak-password':
          setError('Please choose a stronger password.');
          break;

        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;

        case 'permission-denied':
          setError(
            'Firestore permission denied. Please check your ADMIN security rules.'
          );
          break;

        default:
          setError(
            authError.message || 'Admin authentication failed.'
          );
      }
    } finally {
      setLoading(false);
    }
  };

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

          <form
            onSubmit={(event) => handleSubmit(event, 'login')}
            className="admin-login-form"
          >

            <label>
              <span>Admin email</span>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
              />
            </label>

            <label>
              <span>Password</span>

              <div className="admin-password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
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
              <p className="admin-auth-error" role="alert">
                {error}
              </p>
            )}

            {message && (
              <p className="admin-auth-success" role="status">
                {message}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              className="full-width"
              disabled={loading}
            >
              {loading ? 'Please wait...' : 'Admin Login'}
            </Button>

            <button
              type="button"
              className="admin-register-button"
              disabled={loading}
              onClick={(event) => handleSubmit(event, 'register')}
            >
              {loading ? 'Please wait...' : 'Create Admin Account'}
            </button>

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
