const path = require('path');
const PROJ_ROOT    = path.resolve(__dirname, '../..');
const BACKEND      = path.resolve(PROJ_ROOT, 'backend_mysql/src');
const CLIENT       = path.resolve(PROJ_ROOT, 'client');
const CLIENT_MODS  = path.resolve(CLIENT, 'node_modules');
const TEST_MODS    = path.resolve(__dirname, '../node_modules');

// Packages that must resolve to a single instance (React rules of hooks)
const SINGLETON_PKGS = new Set(['react', 'react-dom', 'react/jsx-runtime']);

module.exports = (request, options) => {
  if (request.startsWith('@backend/')) {
    const sub = request.slice('@backend/'.length);
    const resolved = path.resolve(BACKEND, sub);
    try { return require.resolve(resolved); } catch (_) {}
    return options.defaultResolver(resolved, options);
  }
  if (request.startsWith('@client/')) {
    const sub = request.slice('@client/'.length);
    const resolved = path.resolve(CLIENT, sub);
    try { return require.resolve(resolved); } catch (_) {}
    return options.defaultResolver(resolved, options);
  }
  // Force React singletons to resolve from tests/node_modules
  if (SINGLETON_PKGS.has(request)) {
    return options.defaultResolver(request, { ...options, basedir: TEST_MODS });
  }
  // For other packages: try tests/node_modules first, then client/node_modules
  try {
    return options.defaultResolver(request, options);
  } catch (e) {
    return options.defaultResolver(request, {
      ...options,
      basedir: CLIENT_MODS,
      paths: [...(options.paths || []), CLIENT_MODS],
    });
  }
};
