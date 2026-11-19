
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Button from '../Components/Button';
import { logoImage } from '../data/products';
import { auth, db } from '../firebase';
import './AdminLogin.css';
import { Eye, EyeOff } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('admin@skinora.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const adminRecord = await getDoc(doc(db, 'admins', credential.user.uid));
      if (!adminRecord.exists()) {
        await signOut(auth);
        setError('This account is not authorized to access the admin panel.');
        return;
      }
      navigate('/admin/dashboard');
    } catch (loginError) {
      setError(loginError.message || 'Admin sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell admin-login-page">
      <div className="container admin-login-shell">
        <div className="admin-login-panel">
          <div className="admin-login-brand">
            <img src={logoImage} alt="SKINORA logo" className="admin-login-logo" />
            <div>
              <p className="eyebrow">Protected access</p>
              <h1>Admin login</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="admin-login-form">
            <label>
              <span>Admin email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label>
              <span>Password</span>
              <div className="admin-password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </label>

            {error && <p role="alert">{error}</p>}
            <Button type="submit" variant="primary" className="full-width" disabled={loading}>
              {loading ? 'Signing in…' : 'Login'}
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
