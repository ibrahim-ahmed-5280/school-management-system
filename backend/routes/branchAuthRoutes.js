const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimiter');

// Public: Login
router.post('/login', authRateLimiter, login);

// Private: Get Message/Profile
router.get('/me', protect, (req, res) => {
    // Return sanitized user
    const user = req.user.toObject();
    delete user.passwordHash;
    res.json(user);
});

module.exports = router;
