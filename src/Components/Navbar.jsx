import { Link, NavLink } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { logoImage } from '../data/products';
import './Navbar.css';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/products' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

const Navbar = () => {
  const { cartItems } = useStore();

  return (
    <header className="site-header">
      <div className="container navbar-shell">
        <Link to="/" className="brand" aria-label="SKINORA homepage">
          <img src={logoImage} alt="SKINORA logo" className="brand-logo" />
          <div className="brand-copy">
            <span className="brand-name">SKINORA</span>
            <span className="brand-tag">YOUR SKIN, YOUR GLOW</span>
          </div>
        </Link>

        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          <Link to="/login" className="nav-button ghost-button">Login</Link>
          <Link to="/cart" className="cart-pill" aria-label="View cart">
            <span>Cart</span>
            <strong>{cartItems}</strong>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
