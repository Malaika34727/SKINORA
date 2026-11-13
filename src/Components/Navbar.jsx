import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, ShoppingBag, X } from 'lucide-react';
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
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const renderLinks = () => navItems.map((item) => (
    <NavLink
      key={item.to}
      to={item.to}
      onClick={closeMenu}
      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
    >
      {item.label}
    </NavLink>
  ));

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
          {renderLinks()}
        </nav>

        <div className="nav-actions">
          <Link to="/login" className="nav-button ghost-button">Login</Link>
          <Link to="/cart" className="cart-pill" aria-label="View cart">
            <ShoppingBag size={17} strokeWidth={1.7} aria-hidden="true" />
            <span>Cart</span>
            <strong>{cartItems}</strong>
          </Link>
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
      <nav className={`mobile-nav ${menuOpen ? 'open' : ''}`} aria-label="Mobile navigation">
        {renderLinks()}
        <Link to="/login" className="mobile-nav-link" onClick={closeMenu}>Login</Link>
      </nav>
    </header>
  );
};

export default Navbar;
