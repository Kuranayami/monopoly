import { useState, useRef, useCallback, useEffect } from 'react';
import { View } from '../elements.jsx';

export default function ZoomBoard({ children }) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const pinchDist = useRef(0);
  const containerRef = useRef(null);
  const offsetRef = useRef(offset);
  offsetRef.current = offset;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale(s => Math.max(0.2, Math.min(5, s + delta)));
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 1 && dragging.current) {
        e.preventDefault();
        const o = offsetRef.current;
        setOffset({
          x: e.touches[0].clientX - lastPos.current.x,
          y: e.touches[0].clientY - lastPos.current.y,
        });
      } else if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (pinchDist.current > 0) {
          const factor = dist / pinchDist.current;
          setScale(s => Math.max(0.2, Math.min(5, s * factor)));
        }
        pinchDist.current = dist;
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  const onMouseDown = useCallback((e) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  }, [offset]);

  const onMouseMove = useCallback((e) => {
    if (!dragging.current) return;
    setOffset({
      x: e.clientX - lastPos.current.x,
      y: e.clientY - lastPos.current.y,
    });
  }, []);

  const onMouseUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      dragging.current = true;
      lastPos.current = { x: e.touches[0].clientX - offsetRef.current.x, y: e.touches[0].clientY - offsetRef.current.y };
    } else if (e.touches.length === 2) {
      dragging.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    dragging.current = false;
    pinchDist.current = 0;
  }, []);

  return (
    <View ref={containerRef} style={{
      flex: 1, minHeight: 0, alignSelf: 'stretch',
      overflow: 'hidden', position: 'relative',
      cursor: dragging.current ? 'grabbing' : 'grab',
    }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <View style={{
        transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
        transformOrigin: '0 0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minWidth: '100%', minHeight: '100%',
      }}>
        {children}
      </View>
    </View>
  );
}
