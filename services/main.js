// CommonJS entry points:
if (process.env.NODE_ENV === 'production') {
    module.exports = require('./dist/services.cjs.min.js');
} else {
    module.exports = require('./dist/services.cjs.js');
}
