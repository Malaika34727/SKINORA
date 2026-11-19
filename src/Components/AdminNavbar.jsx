import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import './AdminNavbar.css';

const AdminNavbar = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/admin/login', { replace: true });
    } catch (logoutError) {
      setError(logoutError.message || 'Could not sign out.');
    }
  };

  return (
    <header className="admin-header">
      <div className="admin-header-shell">
        <div>
          <p className="admin-header-kicker">Dashboard</p>
          <h2>Welcome back, Admin</h2>
        </div>

        <div className="admin-header-actions">
          <Link to="/" className="admin-link-button">View Store</Link>
          <button type="button" className="admin-link-button danger" onClick={handleLogout}>Logout</button>
        </div>
      </div>
      {error && <p role="alert">{error}</p>}
    </header>
  );
};

export default AdminNavbar;
