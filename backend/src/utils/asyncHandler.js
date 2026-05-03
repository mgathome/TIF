/**
 * Catch les rejections de routes async pour les passer à errorHandler.
 *   router.get('/', asyncHandler(async (req, res) => { ... }));
 */
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
