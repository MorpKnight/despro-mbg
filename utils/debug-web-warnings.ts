// Dev-only filtering for noisy web warnings from dependencies
export function suppressWebWarnings() {
  if (process.env.NODE_ENV !== 'development') return;
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args: any[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    // React Native Web deprecation warning for pointerEvents prop
    if (msg.includes('props.pointerEvents is deprecated. Use style.pointerEvents')) {
      return;
    }
    originalWarn(...args);
  };

  console.error = (...args: any[]) => {
    const msg = args[0]?.message || args[0] || '';
    // Metro source map errors for anonymous functions (harmless)
    if (typeof msg === 'string' && msg.includes('<anonymous>') && msg.includes('ENOENT')) {
      return;
    }
    originalError(...args);
  };
}
