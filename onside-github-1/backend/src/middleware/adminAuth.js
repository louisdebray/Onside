import crypto from 'node:crypto';

function sign(value) {
  const secret = process.env.ADMIN_SESSION_SECRET || 'change-me-please';
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

export function createSessionToken() {
  const value = `admin:${Date.now()}`;
  return `${value}.${sign(value)}`;
}

function isValidToken(token) {
  if (!token || typeof token !== 'string') return false;
  const [value, signature] = token.split('.');
  if (!value || !signature) return false;
  return sign(value) === signature;
}

export function adminAuth(req, res, next) {
  const token = req.cookies?.onside_admin_session;
  if (!isValidToken(token)) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  next();
}
