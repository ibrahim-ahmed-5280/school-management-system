const express = require('express');
const router = express.Router();
const {
    getParentDashboard,
    getStudentGrades,
    getStudentAttendance,
    getStudentInvoices,
    getNotifications,
    markNotificationRead
} = require('../controllers/parentController');
const { protect, authorize, tenantGuard } = require('../middleware/auth');

// Protect all routes under this namespace
router.use(protect);
router.use(authorize('parent'));
router.use(tenantGuard);

// Dashboard
router.get('/dashboard', getParentDashboard);

// Child specifics
router.get('/students/:studentId/grades', getStudentGrades);
router.get('/students/:studentId/attendance', getStudentAttendance);
router.get('/students/:studentId/invoices', getStudentInvoices);

// Notifications
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);

module.exports = router;
