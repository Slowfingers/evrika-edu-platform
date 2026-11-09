const { timingSafeEqual } = require('node:crypto');

module.exports = {
  authenticateToken(req, res, next) {
    const secret = process.env.ADMIN_API_TOKEN;
    if (!secret) return res.status(503).json({ error: 'Административный доступ не настроен' });
    const token = (req.headers.authorization || '').replace(/^Bearer /, '');
    const actual = Buffer.from(token);
    const expected = Buffer.from(secret);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }
    req.user = { role: 'admin' };
    next();
  },
  requireAdmin(req, res, next) {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Доступ запрещён' });
    next();
  }
};
