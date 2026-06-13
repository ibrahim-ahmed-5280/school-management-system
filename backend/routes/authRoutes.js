const express = require('express');
const router = express.Router();
const { registerTenant, login } = require('../controllers/authController');
const { authRateLimiter, registrationRateLimiter } = require('../middleware/rateLimiter');

router.post('/register-tenant', registrationRateLimiter, registerTenant);
router.post('/login', authRateLimiter, login);

module.exports = router;
