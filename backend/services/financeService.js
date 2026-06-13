const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const FeeStructure = require('../models/FeeStructure');
const Enrollment = require('../models/Enrollment');
const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const { createNotification } = require('./notificationService');

/**
 * Service to handle bulk invoice generation logic
 */
const generateBulkInvoices = async ({ tenantId, branchId, academicYearId, classId, studentId }) => {
    const query = { tenantId, academicYearId };
    if (branchId) query.branchId = branchId;
    if (classId) query.classId = classId;
    if (studentId) query.studentId = studentId;

    // 1. Get enrollments
    const enrollments = await Enrollment.find(query);
    if (enrollments.length === 0) return { created: 0, skipped: 0, message: 'No enrollments found' };

    let createdCount = 0;
    let skippedCount = 0;

    for (const enrollment of enrollments) {
        try {
            // Check if invoice already exists
            const existing = await Invoice.findOne({
                tenantId,
                branchId: enrollment.branchId,
                studentId: enrollment.studentId,
                academicYearId
            });

            if (existing) {
                skippedCount++;
                continue; // Skip if already invoiced for this year
            }

            // Get fee structure for this class/branch
            const feeStructure = await FeeStructure.findOne({
                tenantId,
                branchId: enrollment.branchId,
                classId: enrollment.classId,
                academicYearId
            });

            if (!feeStructure) {
                skippedCount++;
                continue; // No fee structure defined for this class
            }

            // Create Invoice
            await Invoice.create({
                tenantId,
                branchId: enrollment.branchId,
                studentId: enrollment.studentId,
                academicYearId,
                items: feeStructure.feeItems,
                totalAmount: feeStructure.totalAmount,
                balance: feeStructure.totalAmount,
                status: 'UNPAID'
            });

            // Dispatch Notifications
            try {
                const studentUser = await User.findOne({ studentId: enrollment.studentId, tenantId });
                if (studentUser) {
                    await createNotification({
                        tenantId,
                        recipientId: studentUser._id,
                        title: `School Fee Invoice Generated`,
                        message: `An invoice of $${feeStructure.totalAmount} has been generated for your school fees.`,
                        type: 'Invoice'
                    });
                }

                const parentUser = await User.findOne({ students: enrollment.studentId, tenantId });
                if (parentUser) {
                    const student = await Student.findById(enrollment.studentId);
                    const studentName = student ? `${student.firstName} ${student.lastName}` : 'Your child';
                    await createNotification({
                        tenantId,
                        recipientId: parentUser._id,
                        title: `Fee Invoice Alert: ${studentName}`,
                        message: `An invoice of $${feeStructure.totalAmount} has been generated for ${studentName}'s school fees.`,
                        type: 'Invoice'
                    });
                }
            } catch (notifyErr) {
                console.error('[FINANCE SERVICE] Failed to dispatch invoice notification:', notifyErr);
            }

            createdCount++;
        } catch (error) {
            console.error(`[FINANCE SERVICE] Bulk Invoice Item Error: ${error.message}`);
            skippedCount++;
        }
    }

    return { created: createdCount, skipped: skippedCount };
};

/**
 * Service for revenue reports
 */
const getRevenueReport = async ({ tenantId, branchId, academicYearId, groupBy }) => {
    const match = { tenantId: new mongoose.Types.ObjectId(tenantId) };
    if (branchId) match.branchId = new mongoose.Types.ObjectId(branchId);
    if (academicYearId) match.academicYearId = new mongoose.Types.ObjectId(academicYearId);

    const pipeline = [
        { $match: match }
    ];

    if (groupBy === 'class') {
        pipeline.push(
            {
                $lookup: {
                    from: 'enrollments',
                    let: { studentId: '$studentId', academicYearId: '$academicYearId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$studentId', '$$studentId'] },
                                        { $eq: ['$academicYearId', '$$academicYearId'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'enrollment'
                }
            },
            { $unwind: { path: '$enrollment', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$enrollment.classId',
                    totalRevenue: { $sum: '$totalAmount' },
                    totalPaid: { $sum: '$paidAmount' },
                    totalBalance: { $sum: '$balance' },
                    count: { $sum: 1 }
                }
            }
        );
    } else {
        let groupField = '$branchId';
        if (groupBy === 'year') groupField = '$academicYearId';

        pipeline.push({
            $group: {
                _id: groupField,
                totalRevenue: { $sum: '$totalAmount' },
                totalPaid: { $sum: '$paidAmount' },
                totalBalance: { $sum: '$balance' },
                count: { $sum: 1 }
            }
        });
    }

    // Optional: Populate the ID names if possible, or leave for controller
    return await Invoice.aggregate(pipeline);
};

module.exports = {
    generateBulkInvoices,
    getRevenueReport
};
