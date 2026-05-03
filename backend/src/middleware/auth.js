const { verifyAccessToken } = require('../utils/jwt');
const { Unauthorized, Forbidden } = require('../utils/errors');

/**
 * Lit `Authorization: Bearer <token>` et attache `req.user = { id, role, email }`.
 * Ne fait pas l'appel DB : le token est la source de vérité (jusqu'à expiration).
 */
function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const [, token] = header.split('Bearer ');
  if (!token) return next(new Unauthorized('Missing access token'));

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch (err) {
    next(new Unauthorized('Invalid or expired token'));
  }
}

/**
 * À utiliser après requireAuth :
 *   router.post('/menu', requireAuth, requireRole('restaurant'), ...)
 */
function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new Unauthorized());
    if (!roles.includes(req.user.role)) return next(new Forbidden('Insufficient role'));
    next();
  };
}

module.exports = { requireAuth, requireRole };
