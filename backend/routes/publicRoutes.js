const express = require('express');
const router = express.Router();
const { getPublicStats, getPublicPlans } = require('../controllers/platformController');

router.get('/stats', getPublicStats);
router.get('/plans', getPublicPlans);

module.exports = router;
