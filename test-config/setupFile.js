const crypto = require('crypto');
// Polyfill for getRandomValues function in test environment.
// https://github.com/uuidjs/uuid#getrandomvalues-not-supported
Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: arr => crypto.randomBytes(arr.length)
  }
});
