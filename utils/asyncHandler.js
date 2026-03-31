// ============================================
// Async Handler Wrapper
// Wraps async route handlers so that any thrown
// error is automatically forwarded to Express's
// next() error handler, eliminating try/catch
// boilerplate in every controller method.
// ============================================

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;