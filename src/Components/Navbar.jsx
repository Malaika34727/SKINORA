import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { useAuth } from '../context/AuthContextValue';
import { useStore } from '../context/StoreContextValue';
import { logoImage } from '../data/products';
import { signOutCustomer } from '../services/authService';
import './Navbar.css';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/products' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

const Navbar = () => {
  const { cartItems } = useStore();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  const closeMenu = () => setMenuOpen(false);
  const handleLogout = async () => {
    setLogoutError('');
    try {
      await signOutCustomer();
      closeMenu();
    } catch (error) {
      setLogoutError(`Could not sign out: ${error.message}`);
    }
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <header className={`site-header ${isScrolled ? 'is-scrolled' : ''}`}>
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
          {user ? (
            <>
              <Link to="/account" className="nav-button ghost-button">Account</Link>
              <button type="button" className="nav-button ghost-button" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <Link to="/login" className="nav-button ghost-button">Login</Link>
          )}
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
        {user ? (
          <>
            <Link to="/account" className="mobile-nav-link" onClick={closeMenu}>My account</Link>
            <button type="button" className="mobile-nav-link" onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <Link to="/login" className="mobile-nav-link" onClick={closeMenu}>Login</Link>
        )}
      </nav>
      {logoutError && <p className="container" role="alert">{logoutError}</p>}
    </header>
  );
};

export default Navbar;
