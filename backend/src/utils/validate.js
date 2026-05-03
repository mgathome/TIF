const { BadRequest } = require('./errors');

/**
 * Wrapper zod -> middleware Express. Ex:
 *   router.post('/', validate(schema), controller)
 */
function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(new BadRequest('Validation failed', result.error.flatten()));
    }
    req[source] = result.data;
    next();
  };
}

module.exports = { validate };
