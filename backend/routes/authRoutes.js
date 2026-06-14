const express = require('express');
const router = express.Router();
const { registerTenant, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authRateLimiter, registrationRateLimiter } = require('../middleware/rateLimiter');

const requireLoginRole = (role) => (req, res, next) => {
    req.body = { ...req.body, requiredRoles: [role] };
    next();
};

router.post('/register-tenant', registrationRateLimiter, registerTenant);
router.post('/login', authRateLimiter, login);
router.post('/finance/login', authRateLimiter, requireLoginRole('finance_director'), login);
router.get('/me', protect, getMe);

module.exports = router;
