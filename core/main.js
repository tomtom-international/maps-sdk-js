// CommonJS entry points:
if (process.env.NODE_ENV === 'production') {
    module.exports = require('./dist/core.cjs.min.js');
} else {
    module.exports = require('./dist/core.cjs.js');
}
