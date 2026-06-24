const FILTER_PATTERNS = [
  '[DEPRECATED] Default export is deprecated',
  'THREE.Clock: This module has been deprecated',
  'using deprecated parameters for the initialization function',
  'Context Lost',
  'Context Restored',
];
const origWarn = console.warn;
console.warn = (...args) => {
  const msg = typeof args[0] === 'string' ? args[0] : args[0]?.message || '';
  if (FILTER_PATTERNS.some(p => msg.includes(p))) return;
  origWarn.apply(console, args);
};
const origLog = console.log;
console.log = (...args) => {
  const msg = typeof args[0] === 'string' ? args[0] : args[0]?.message || '';
  if (msg.includes('THREE.WebGLRenderer') && (msg.includes('Context Lost') || msg.includes('Context Restored'))) return;
  origLog.apply(console, args);
};
