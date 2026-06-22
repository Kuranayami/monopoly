import { useState, useEffect, useCallback } from 'react';

export function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    let raf;
    const handler = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setSize({ width: window.innerWidth, height: window.innerHeight }));
    };
    window.addEventListener('resize', handler);
    return () => { window.removeEventListener('resize', handler); cancelAnimationFrame(raf); };
  }, []);
  return size;
}

export function useIsMobile() {
  const { width } = useWindowSize();
  return width < 640;
}

export function useIsTablet() {
  const { width } = useWindowSize();
  return width >= 640 && width < 1024;
}

export function useIsDesktop() {
  const { width } = useWindowSize();
  return width >= 1024;
}

export function useSocket(url) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let destroyed = false;
    import('socket.io-client').then(({ io }) => {
      if (destroyed) return;
      const s = io(url, { transports: ['polling', 'websocket'] });
      s.on('connect', () => { if (!destroyed) setConnected(true); });
      s.on('disconnect', () => { if (!destroyed) setConnected(false); });
      setSocket(s);
    });
    return () => { destroyed = true; };
  }, [url]);

  return { socket, connected };
}

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch { return initial; }
  });

  const setStored = useCallback((val) => {
    setValue(val);
    try { localStorage.setItem(key, JSON.stringify(val)); }
    catch {}
  }, [key]);

  return [value, setStored];
}
