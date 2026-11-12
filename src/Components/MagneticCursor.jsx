import { useEffect, useState } from 'react';
import './MagneticCursor.css';

const MagneticCursor = () => {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    if (window.matchMedia('(pointer: coarse)').matches) {
      return undefined;
    }

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) {
      return undefined;
    }

    const handleMove = (event) => {
      setMouse({ x: event.clientX, y: event.clientY });
    };

    const handleMouseEnter = () => setHovering(true);
    const handleMouseLeave = () => setHovering(false);

    document.querySelectorAll('a, button, .product-card, .category-card, .magnetic-card, input, textarea').forEach((element) => {
      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);
    });

    window.addEventListener('mousemove', handleMove);

    let animationFrame = null;

    const animate = () => {
      setCursor((prev) => ({
        x: prev.x + (mouse.x - prev.x) * 0.18,
        y: prev.y + (mouse.y - prev.y) * 0.18,
      }));
      animationFrame = window.requestAnimationFrame(animate);
    };

    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      document.querySelectorAll('a, button, .product-card, .category-card, .magnetic-card, input, textarea').forEach((element) => {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
      });
      window.removeEventListener('mousemove', handleMove);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [mouse.x, mouse.y]);

  return (
    <div
      className={`magnetic-cursor ${hovering ? 'active' : ''}`}
      style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
      aria-hidden="true"
    />
  );
};

export default MagneticCursor;
