import { Link } from 'react-router-dom';
import Button from '../Components/Button';
import { logoImage } from '../data/products';
import './Login.css';

const Login = () => {
  return (
    <div className="page-shell login-page">
      <div className="container login-shell">
        <div className="login-panel">
          <div className="login-brand">
            <img src={logoImage} alt="SKINORA logo" className="login-logo" />
            <div>
              <p className="eyebrow">Welcome back</p>
              <h1>Sign in to SKINORA</h1>
            </div>
          </div>

          <div className="login-badge-row">
            <span className="login-email-pill">safina@gmail.com</span>
          </div>

          <button type="button" className="google-login-button">
            <span className="google-mark">G</span>
            Continue with Google
          </button>

          <div className="divider"><span>or</span></div>

          <form className="login-form">
            <label>
              <span>Email address</span>
              <input type="email" value="safina@gmail.com" readOnly />
            </label>

            <label>
              <span>Password</span>
              <input type="password" placeholder="Enter your password" />
            </label>

            <Button type="submit" variant="primary" className="full-width">Login</Button>
          </form>

          <p className="login-footer-text">
            Don’t have an account? <Link to="/products">Continue as guest</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
