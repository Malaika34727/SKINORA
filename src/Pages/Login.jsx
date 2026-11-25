
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

import Button from '../Components/Button';
import { logoImage } from '../data/products';
import { auth, db } from '../firebase';

import {
  createCustomerAccount,
  resetCustomerPassword,
  signInCustomer,
  signOutCustomer,
} from '../services/authService';

import './Login.css';

// Create customer profile for Google users
const ensureCustomerProfile = async (user) => {
  if (!user?.uid || !user.email) {
    throw new Error('Google account information is incomplete.');
  }

  const userRef = doc(db, 'CREATEACCUSER', user.uid);
  const userSnapshot = await getDoc(userRef);

  // Profile already exists
  if (userSnapshot.exists()) {
    return userSnapshot.data();
  }

  // Create profile for a new Google customer
  const customerData = {
    uid: user.uid,
    name: user.displayName || 'Customer',
    email: user.email,
    phone: user.phoneNumber || '',
    provider: 'google.com',
    cart: [],
    createdAt: serverTimestamp(),
  };

  await setDoc(userRef, customerData);

  return customerData;
};

const Login = ({ initialMode = 'login' }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const mode =
    location.pathname === '/signup' || initialMode === 'register'
      ? 'register'
      : 'login';

  const goToHome = () => {
    navigate('/home', { replace: true });
  };

  // EMAIL LOGIN
  const handleEmailLogin = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await signInCustomer(email, password);
      goToHome();
    } catch (loginError) {
      setError(loginError.message || 'Sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  // CREATE CUSTOMER ACCOUNT
  const handleRegister = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match.');
      }

      await createCustomerAccount({
        name,
        email,
        password,
      });

      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      goToHome();
    } catch (registerError) {
      setError(registerError.message || 'Account creation failed.');
    } finally {
      setLoading(false);
    }
  };

  // PASSWORD RESET
  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setError('Enter your email address before requesting a reset link.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await resetCustomerPassword(email);
      setSuccess('Password reset instructions were sent to your email.');
    } catch (resetError) {
      setError(resetError.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  // GOOGLE LOGIN
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    let signedInUser = null;

    try {
      const credential = await signInWithPopup(
        auth,
        new GoogleAuthProvider()
      );

      signedInUser = credential.user;

      await ensureCustomerProfile(signedInUser);

      goToHome();
    } catch (loginError) {
      if (
        signedInUser &&
        auth.currentUser?.uid === signedInUser.uid
      ) {
        try {
          await signOutCustomer();
        } catch (signOutError) {
          setError(
            `${loginError.message} The account could not be signed out: ${signOutError.message}`
          );
          return;
        }
      }

      setError(loginError.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const heading =
    mode === 'login'
      ? 'Sign in to SKINORA'
      : 'Create your SKINORA account';

  return (
    <div className="page-shell login-page">
      <div className="container login-shell">
        <div className="login-panel">

          <div className="login-brand">
            <img
              src={logoImage}
              alt="SKINORA logo"
              className="login-logo"
            />

            <div>
              <p className="eyebrow">
                {mode === 'login' ? 'Welcome back' : 'New customer'}
              </p>

              <h1>{heading}</h1>
            </div>
          </div>

          <div className="login-badge-row">
            <span className="login-email-pill">
              {mode === 'login'
                ? 'Sign in to your account'
                : 'Create a secure customer account'}
            </span>
          </div>

          <button
            type="button"
            className="google-login-button"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <span className="google-mark">G</span>
            Continue with Google
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          {mode === 'login' ? (
            <form
              className="login-form"
              onSubmit={handleEmailLogin}
            >
              <label>
                <span>Email address</span>

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                <span>Password</span>

                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>

              {error && <p role="alert">{error}</p>}
              {success && <p role="status">{success}</p>}

              <Button
                type="submit"
                variant="primary"
                className="full-width"
                disabled={loading}
              >
                {loading ? 'Signing in…' : 'Login'}
              </Button>

              <Button
                type="button"
                variant="secondary"
                className="full-width"
                onClick={handlePasswordReset}
                disabled={loading}
              >
                Reset password
              </Button>
            </form>
          ) : (
            <form
              className="login-form"
              onSubmit={handleRegister}
            >
              <label>
                <span>Full name</span>

                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  required
                  minLength="2"
                  maxLength="120"
                />
              </label>

              <label>
                <span>Email address</span>

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                <span>Password</span>

                <input
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                  minLength="6"
                />
              </label>

              <label>
                <span>Confirm password</span>

                <input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  autoComplete="new-password"
                  required
                  minLength="6"
                />
              </label>

              {error && <p role="alert">{error}</p>}
              {success && <p role="status">{success}</p>}

              <Button
                type="submit"
                variant="primary"
                className="full-width"
                disabled={loading}
              >
                {loading ? 'Creating account…' : 'Create account'}
              </Button>
            </form>
          )}

          <p className="login-footer-text">
            {mode === 'login' ? (
              <>
                New to SKINORA?{' '}
                <Link to="/signup">
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link to="/login">
                  Sign in
                </Link>
              </>
            )}
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login;
