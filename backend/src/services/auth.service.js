// Заглушка для auth.service - для экспорта данных не нужна авторизация
const AuthService = {
  authenticateToken: (req, res, next) => next(),
  requireAdmin: (req, res, next) => next()
};

module.exports = AuthService;
