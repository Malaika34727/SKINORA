import { useEffect, useState } from 'react';
import { logoImage } from '../data/products';
import './IntroScreen.css';

const IntroScreen = () => {
  const [visible, setVisible] = useState(() => window.sessionStorage.getItem('skinora-intro-shown') !== 'true');

  useEffect(() => {
    if (visible) window.sessionStorage.setItem('skinora-intro-shown', 'true');
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="intro-screen"
      role="status"
      aria-label="SKINORA — Reveal Your Natural Glow"
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) setVisible(false);
      }}
    >
      <div className="intro-content">
        <img src={logoImage} alt="" className="intro-logo" />
        <span className="intro-wordmark">SKINORA</span>
        <span className="intro-rule" />
        <p>Reveal Your Natural Glow</p>
      </div>
      <button type="button" className="intro-skip" onClick={() => setVisible(false)}>
        Enter
      </button>
    </div>
  );
};

export default IntroScreen;
