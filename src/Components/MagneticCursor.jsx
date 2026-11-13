import { useEffect, useRef } from 'react';
import './MagneticCursor.css';

const MagneticCursor = () => {
  const cursorRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const finePointer = window.matchMedia('(pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!cursor || !finePointer.matches || reducedMotion.matches) return undefined;

    let frameId = 0;
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;

    const animate = () => {
      x += (targetX - x) * 0.24;
      y += (targetY - y) * 0.24;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;

      if (Math.abs(targetX - x) > 0.5 || Math.abs(targetY - y) > 0.5) {
        frameId = window.requestAnimationFrame(animate);
      } else {
        frameId = 0;
      }
    };

    const handleMove = (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      cursor.classList.add('is-visible');
      if (!frameId) frameId = window.requestAnimationFrame(animate);
    };

    const handlePointerOver = (event) => {
      if (event.target instanceof Element && event.target.closest('a, button, input, textarea, select, .product-card, .category-card')) {
        cursor.classList.add('active');
      }
    };

    const handlePointerOut = (event) => {
      if (!(event.target instanceof Element)) return;
      const leavingInteractive = event.target.closest('a, button, input, textarea, select, .product-card, .category-card');
      const enteringInteractive = event.relatedTarget instanceof Element
        && event.relatedTarget.closest('a, button, input, textarea, select, .product-card, .category-card');
      if (leavingInteractive && !enteringInteractive) cursor.classList.remove('active');
    };

    const handlePointerLeave = () => {
      cursor.classList.remove('is-visible', 'active');
    };

    window.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerover', handlePointerOver);
    document.addEventListener('pointerout', handlePointerOut);
    document.documentElement.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerover', handlePointerOver);
      document.removeEventListener('pointerout', handlePointerOut);
      document.documentElement.removeEventListener('pointerleave', handlePointerLeave);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, []);

  return <div ref={cursorRef} className="magnetic-cursor" aria-hidden="true" />;
};

export default MagneticCursor;
