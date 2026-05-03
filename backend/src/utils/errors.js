/**
 * Erreurs HTTP typées. Le middleware errorHandler les traduit en JSON.
 */
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
class BadRequest   extends HttpError { constructor(m='Bad request', d)  { super(400, m, d); } }
class Unauthorized extends HttpError { constructor(m='Unauthorized')    { super(401, m); } }
class Forbidden    extends HttpError { constructor(m='Forbidden')       { super(403, m); } }
class NotFound     extends HttpError { constructor(m='Not found')       { super(404, m); } }
class Conflict     extends HttpError { constructor(m='Conflict', d)     { super(409, m, d); } }

module.exports = { HttpError, BadRequest, Unauthorized, Forbidden, NotFound, Conflict };
