import { Link } from 'react-router-dom';
import { logoImage } from '../data/products';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand-column">
          <div className="brand footer-brand">
            <img src={logoImage} alt="SKINORA logo" className="brand-logo" />
            <div className="brand-copy">
              <span className="brand-name">SKINORA</span>
              <span className="brand-tag">YOUR SKIN, YOUR GLOW</span>
            </div>
          </div>
          <p className="footer-copy">
            Clean formulas, elevated rituals, and beauty routines designed to bring back your natural glow.
          </p>
        </div>

        <div className="footer-links">
          <h4>Shop</h4>
          <Link to="/products">All Products</Link>
          <Link to="/products">Best Sellers</Link>
          <Link to="/products">New Arrivals</Link>
        </div>

        <div className="footer-links">
          <h4>Company</h4>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/login">Login</Link>
        </div>

        <div className="footer-links">
          <h4>Connect</h4>
          <a href="mailto:hello@skinora.com">hello@skinora.com</a>
          <a href="https://wa.me/923001234567" target="_blank" rel="noreferrer">WhatsApp</a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 SKINORA. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
