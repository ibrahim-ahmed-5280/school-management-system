const express = require('express');
const router = express.Router();
const { 
    registerTenant, 
    getTenants,
    getTenantDetails,
    platformLogin,
    getPlatformDashboard,
    getPlatformPlans,
    getPlatformHealth,
    getPlatformAuditLogs,
    getPlatformSettings,
    updatePlatformSettings,
    updateTenantStatus,
    updateTenantPlan,
    createPlatformPlan,
    updatePlatformPlan,
    deletePlatformPlan,
    testPlatformSmtp
} = require('../controllers/platformController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');
const { authRateLimiter, registrationRateLimiter } = require('../middleware/rateLimiter');

// Public platform auth routes
router.post('/auth/login', authRateLimiter, platformLogin);

// Restricted to Platform Owner
router.use(protect);
router.use(authorize('platform_owner'));

router.get('/dashboard', getPlatformDashboard);
router.post('/tenants', registrationRateLimiter, upload.single('logo'), registerTenant);
router.get('/tenants', getTenants);
router.get('/tenants/:id', getTenantDetails);
router.patch('/tenants/:id/status', updateTenantStatus);
router.put('/tenants/:id/plan', updateTenantPlan);
router.get('/plans', getPlatformPlans);
router.post('/plans', createPlatformPlan);
router.put('/plans/:id', updatePlatformPlan);
router.delete('/plans/:id', deletePlatformPlan);
router.get('/health', getPlatformHealth);
router.get('/audit-logs', getPlatformAuditLogs);
router.get('/settings', getPlatformSettings);
router.put('/settings', upload.single('logo'), updatePlatformSettings);
router.post('/settings/test-email', testPlatformSmtp);

module.exports = router;
