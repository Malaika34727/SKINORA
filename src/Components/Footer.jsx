import { AtSign, Mail, MessageCircle, MoveUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { logoImage } from '../data/products';
import './Footer.css';

const Footer = () => (
  <footer className="site-footer">
    <div className="container footer-grid">
      <div className="footer-brand-column">
        <Link to="/" className="brand footer-brand" aria-label="SKINORA homepage">
          <img src={logoImage} alt="" className="brand-logo" />
          <div className="brand-copy">
            <span className="brand-name">SKINORA</span>
            <span className="brand-tag">REVEAL YOUR NATURAL GLOW</span>
          </div>
        </Link>
        <p className="footer-copy">
          Thoughtful skincare, considered ingredients, and small rituals that bring you back to your natural glow.
        </p>
        <div className="footer-socials" aria-label="Social media">
          <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
            <AtSign size={17} strokeWidth={1.6} />
          </a>
          <a href="https://wa.me/923001234567" target="_blank" rel="noreferrer" aria-label="WhatsApp">
            <MessageCircle size={17} strokeWidth={1.6} />
          </a>
        </div>
      </div>

      <nav className="footer-links" aria-label="Shop navigation">
        <h4>Explore</h4>
        <Link to="/products">Shop all</Link>
        <Link to="/about">Our story</Link>
        <Link to="/products">Skincare rituals</Link>
      </nav>

      <nav className="footer-links" aria-label="Customer service">
        <h4>Customer care</h4>
        <Link to="/contact">Contact us</Link>
        <Link to="/cart">Your bag</Link>
        <a href="https://wa.me/923001234567" target="_blank" rel="noreferrer">Order support</a>
      </nav>

      <div className="footer-links footer-contact">
        <h4>Get in touch</h4>
        <a href="mailto:hello@skinora.com"><Mail size={15} /> hello@skinora.com</a>
        <a href="https://instagram.com" target="_blank" rel="noreferrer"><AtSign size={15} /> @skinoraofficial</a>
        <Link to="/contact" className="footer-contact-link">We’re here to help <MoveUpRight size={14} /></Link>
      </div>
    </div>

    <div className="footer-bottom">
      <div className="container footer-bottom-inner">
        <p>© 2026 SKINORA. All rights reserved.</p>
        <span>Care, with intention.</span>
      </div>
    </div>
  </footer>
);

export default Footer;
