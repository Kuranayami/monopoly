const FILTER_PATTERNS = [
  '[DEPRECATED] Default export is deprecated',
  'THREE.Clock: This module has been deprecated',
  'using deprecated parameters for the initialization function',
];
const origWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && FILTER_PATTERNS.some(p => args[0].includes(p))) return;
  origWarn.apply(console, args);
};
