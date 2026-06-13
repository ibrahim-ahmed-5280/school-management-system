const Student = require('../models/Student');
const User = require('../models/User');
const Result = require('../models/Result');
const AttendanceRecord = require('../models/AttendanceRecord');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const Enrollment = require('../models/Enrollment');

const sendResponse = (res, success, data = null, message = '') => {
    return res.json({ success, message, data });
};

const sendError = (res, code, message) => {
    return res.status(code).json({ success: false, message });
};

// Security check: Verify that this student is indeed linked to the parent
const verifyParentAccess = (req, studentId) => {
    const parentStudents = req.user.students || [];
    return parentStudents.map(id => id.toString()).includes(studentId.toString());
};

// @desc    Get Parent Dashboard details (list children with overview status)
// @route   GET /api/parent/dashboard
// @access  Private (Parent)
const getParentDashboard = async (req, res) => {
    try {
        const studentIds = req.user.students || [];
        if (studentIds.length === 0) {
            return sendResponse(res, true, [], 'No linked students found');
        }

        const childrenData = [];

        for (const studentId of studentIds) {
            const student = await Student.findOne({ _id: studentId, tenantId: req.tenantId });
            if (!student) continue;

            // Get enrollment
            const enrollment = await Enrollment.findOne({
                studentId,
                tenantId: req.tenantId,
                status: { $in: ['Current', 'Active', 'active'] }
            })
            .populate('classId', 'name gradeLevel')
            .populate('academicYearId', 'name');

            // Get financial summary
            const invoices = await Invoice.find({ studentId, tenantId: req.tenantId });
            const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
            const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
            const outstanding = totalInvoiced - totalPaid;

            // Get attendance summary
            const totalRecords = await AttendanceRecord.countDocuments({ studentId, tenantId: req.tenantId });
            const presentRecords = await AttendanceRecord.countDocuments({ studentId, tenantId: req.tenantId, status: 'PRESENT' });
            const attendanceRate = totalRecords > 0 ? ((presentRecords / totalRecords) * 100).toFixed(1) + '%' : 'N/A';

            childrenData.push({
                student: {
                    _id: student._id,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    studentCode: student.studentCode,
                    admissionNumber: student.admissionNumber
                },
                className: enrollment?.classId?.name || 'Unassigned',
                academicYear: enrollment?.academicYearId?.name || 'N/A',
                outstandingFees: outstanding,
                attendanceRate
            });
        }

        sendResponse(res, true, childrenData);
    } catch (error) {
        sendError(res, 500, error.message);
    }
};

// @desc    Get Student Grades
// @route   GET /api/parent/students/:studentId/grades
// @access  Private (Parent)
const getStudentGrades = async (req, res) => {
    try {
        const { studentId } = req.params;

        if (!verifyParentAccess(req, studentId)) {
            return sendError(res, 403, 'Unauthorized access to student record');
        }

        const results = await Result.find({
            studentId,
            tenantId: req.tenantId
        })
        .populate({
            path: 'examId',
            populate: [
                { path: 'subjectId', select: 'name code' },
                { path: 'examCategoryId', select: 'name' }
            ]
        })
        .sort({ createdAt: -1 });

        sendResponse(res, true, results);
    } catch (error) {
        sendError(res, 500, error.message);
    }
};

// @desc    Get Student Attendance
// @route   GET /api/parent/students/:studentId/attendance
// @access  Private (Parent)
const getStudentAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;

        if (!verifyParentAccess(req, studentId)) {
            return sendError(res, 403, 'Unauthorized access to student record');
        }

        const records = await AttendanceRecord.find({
            studentId,
            tenantId: req.tenantId
        })
        .populate({
            path: 'sessionId',
            select: 'date period teacherUserId',
            populate: { path: 'teacherUserId', select: 'name' }
        })
        .sort({ createdAt: -1 });

        sendResponse(res, true, records);
    } catch (error) {
        sendError(res, 500, error.message);
    }
};

// @desc    Get Student Invoices
// @route   GET /api/parent/students/:studentId/invoices
// @access  Private (Parent)
const getStudentInvoices = async (req, res) => {
    try {
        const { studentId } = req.params;

        if (!verifyParentAccess(req, studentId)) {
            return sendError(res, 403, 'Unauthorized access to student record');
        }

        const invoices = await Invoice.find({
            studentId,
            tenantId: req.tenantId
        }).sort({ createdAt: -1 });

        const payments = await Payment.find({
            invoiceId: { $in: invoices.map(i => i._id) },
            tenantId: req.tenantId
        }).sort({ createdAt: -1 });

        sendResponse(res, true, { invoices, payments });
    } catch (error) {
        sendError(res, 500, error.message);
    }
};

// @desc    Get Notifications for Parent
// @route   GET /api/parent/notifications
// @access  Private (Parent)
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipientId: req.user._id,
            tenantId: req.tenantId
        }).sort({ createdAt: -1 });

        sendResponse(res, true, notifications);
    } catch (error) {
        sendError(res, 500, error.message);
    }
};

// @desc    Mark Notification as Read
// @route   PUT /api/parent/notifications/:id/read
// @access  Private (Parent)
const markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipientId: req.user._id, tenantId: req.tenantId },
            { $set: { isRead: true } },
            { new: true }
        );

        if (!notification) return sendError(res, 404, 'Notification not found');
        sendResponse(res, true, notification, 'Notification marked as read');
    } catch (error) {
        sendError(res, 500, error.message);
    }
};

module.exports = {
    getParentDashboard,
    getStudentGrades,
    getStudentAttendance,
    getStudentInvoices,
    getNotifications,
    markNotificationRead
};
