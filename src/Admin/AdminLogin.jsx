import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../Components/Button';
import { logoImage } from '../data/products';
import './AdminLogin.css';

const AdminLogin = () => {
  const [email, setEmail] = useState('admin@skinora.com');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    if (email && password) {
      localStorage.setItem('skinora-admin-logged-in', 'true');
      navigate('/admin/dashboard');
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
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>

            <label>
              <span>Password</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" />
            </label>

            <Button type="submit" variant="primary" className="full-width">Login</Button>
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
