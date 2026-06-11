import { useRef, useCallback } from 'react';

function useSwipe({ onSwipeLeft, onSwipeRight, onSwipeDown, threshold = 60 }) {
  const startRef = useRef(null);
  const startTimeRef = useRef(0);

  const onTouchStart = useCallback((e) => {
    const t = e.touches[0];
    startRef.current = { x: t.clientX, y: t.clientY };
    startTimeRef.current = Date.now();
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (!startRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - startRef.current.x;
    const dy = t.clientY - startRef.current.y;
    const elapsed = Date.now() - startTimeRef.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    startRef.current = null;

    if (elapsed > 500) return;
    if (absDx < threshold && absDy < threshold) return;

    if (absDx > absDy) {
      if (dx > 0 && onSwipeRight) onSwipeRight(e);
      else if (dx < 0 && onSwipeLeft) onSwipeLeft(e);
    } else {
      if (dy > 0 && onSwipeDown) onSwipeDown(e);
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeDown, threshold]);

  return { onTouchStart, onTouchEnd };
}

export default useSwipe;
