import { Link } from 'react-router-dom';
import './AdminNavbar.css';

const AdminNavbar = () => {
  const handleLogout = () => {
    localStorage.removeItem('skinora-admin-logged-in');
    window.location.href = '/admin/login';
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
    </header>
  );
};

export default AdminNavbar;
