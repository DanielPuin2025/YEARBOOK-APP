const crypto = require('crypto');

const tokenSecret = process.env.AUTH_TOKEN_SECRET || 'development-only-secret-change-before-deployment';
const tokenLifetimeSeconds = 8 * 60 * 60;

function sign(payload) {
  return crypto.createHmac('sha256', tokenSecret).update(payload).digest('base64url');
}

function createAdminToken(adminId) {
  const payload = Buffer.from(JSON.stringify({
    sub: adminId,
    exp: Math.floor(Date.now() / 1000) + tokenLifetimeSeconds
  })).toString('base64url');

  return `${payload}.${sign(payload)}`;
}

function isValidAdminToken(token) {
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const expectedSignature = Buffer.from(sign(parts[0]));
  const providedSignature = Buffer.from(parts[1]);
  if (providedSignature.length !== expectedSignature.length) return false;
  if (!crypto.timingSafeEqual(providedSignature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    return Number.isInteger(payload.sub)
      && Number.isInteger(payload.exp)
      && payload.exp > Math.floor(Date.now() / 1000);
  } catch (err) {
    return false;
  }
}

function requireAdmin(req, res, next) {
  const authorization = req.get('Authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match || !isValidAdminToken(match[1])) {
    return res.status(401).json({ error: 'Se requiere iniciar sesión como administrador.' });
  }

  next();
}

module.exports = { createAdminToken, requireAdmin };
