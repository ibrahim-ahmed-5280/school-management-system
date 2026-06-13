const Exam = require('../models/Exam');
const Result = require('../models/Result');

// @desc    Create a new exam
// @route   POST /api/exams
const Branch = require('../models/Branch');

// @desc    Create a new exam
// @route   POST /api/exams
const createExam = async (req, res) => {
    let { classId, academicYearId, name, term, branchId } = req.body;
    try {
        // Resolve Branch ID
        if (req.branchId) {
            branchId = req.branchId;
        } else if (!branchId) {
            const defaultBranch = await Branch.findOne({ tenantId: req.tenantId });
            if (defaultBranch) {
                branchId = defaultBranch._id;
            } else {
                return res.status(400).json({ message: 'No branch found. Please create a branch first.' });
            }
        }

        const exam = await Exam.create({
            tenantId: req.tenantId,
            branchId, 
            classId,
            academicYearId,
            name,
            term
        });
        res.status(201).json(exam);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Submit results for a student in an exam
// @route   POST /api/exams/:examId/results
const submitResult = async (req, res) => {
    const { examId } = req.params;
    let { studentId, subjects, remarks, branchId } = req.body;

    try {
        const exam = await Exam.findById(examId);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });

        // Resolve Branch ID
        if (req.branchId) {
            branchId = req.branchId;
        } else if (!branchId) {
            const defaultBranch = await Branch.findOne({ tenantId: req.tenantId });
            branchId = defaultBranch ? defaultBranch._id : null;
        }
        
        if (!branchId) return res.status(400).json({ message: 'Branch ID required' });

        // STRICT TEACHER VALIDATION
        if (req.role === 'teacher') {
            const assignment = await TeacherAssignment.findOne({
                teacherId: req.user._id,
                classId: exam.classId,
                academicYearId: exam.academicYearId
            });

            if (!assignment) {
                return res.status(403).json({ 
                    message: 'Access Denied: You are not assigned to this class and academic year.' 
                });
            }

            // Ensure teacher is ONLY submitting for their assigned subject
            // We iterate through provided subjects and check against assignment
            for (const sub of subjects) {
                if (sub.name.toLowerCase() !== assignment.subject.toLowerCase()) {
                    return res.status(403).json({ 
                        message: `Access Denied: You are only authorized to grade '${assignment.subject}'. You cannot submit grades for '${sub.name}'.` 
                    });
                }
            }
        }

        const totalScore = subjects.reduce((acc, sub) => acc + sub.score, 0);
        const maxTotal = subjects.reduce((acc, sub) => acc + (sub.maxScore || 100), 0);
        const percentage = maxTotal > 0 ? (totalScore / maxTotal) * 100 : 0;

        let overallGrade = 'F';
        if (percentage >= 90) overallGrade = 'A+';
        else if (percentage >= 80) overallGrade = 'A';
        else if (percentage >= 70) overallGrade = 'B';
        else if (percentage >= 60) overallGrade = 'C';
        else if (percentage >= 50) overallGrade = 'D';

        // Use findOneAndUpdate to merge or update results. 
        // Note: Ideally we should merge subjects if multiple teachers grade the same student for different subjects,
        // but for now we are overwriting/upserting the document. 
        // If we want to support multiple subjects from different teachers, we'd need to push to an array.
        // Given constraints "A class + subject... can be assigned to only one teacher", this implies uniqueness per subject.
        // So we should actually find existing result and push/update the specific subject.
        
        let result = await Result.findOne({ examId, studentId });
        if (!result) {
            result = new Result({
                tenantId: req.tenantId,
                branchId,
                examId,
                studentId,
                subjects,
                totalScore,
                percentage,
                overallGrade,
                remarks
            });
        } else {
            // Update or Add subjects
            subjects.forEach(newSub => {
                const existingIndex = result.subjects.findIndex(s => s.name.toLowerCase() === newSub.name.toLowerCase());
                if (existingIndex >= 0) {
                    result.subjects[existingIndex] = newSub;
                } else {
                    result.subjects.push(newSub);
                }
            });
            // Recalculate totals
            result.totalScore = result.subjects.reduce((acc, sub) => acc + sub.score, 0);
            const mTotal = result.subjects.reduce((acc, sub) => acc + (sub.maxScore || 100), 0);
            result.percentage = mTotal > 0 ? (result.totalScore / mTotal) * 100 : 0;
            
            if (result.percentage >= 90) result.overallGrade = 'A+';
            else if (result.percentage >= 80) result.overallGrade = 'A';
            else if (result.percentage >= 70) result.overallGrade = 'B';
            else if (result.percentage >= 60) result.overallGrade = 'C';
            else if (result.percentage >= 50) result.overallGrade = 'D';
            else result.overallGrade = 'F';
            
            result.remarks = remarks || result.remarks;
        }

        await result.save();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const TeacherAssignment = require('../models/TeacherAssignment');

const getExams = async (req, res) => {
    try {
        const query = { tenantId: req.tenantId };
        if (req.branchId) query.branchId = req.branchId;

        // If user is a teacher, filter by their assigned classes
        if (req.role === 'teacher') {
            const assignments = await TeacherAssignment.find({ teacherId: req.user._id });
            const classIds = assignments.map(a => a.classId);
            query.classId = { $in: classIds };
        }

        const exams = await Exam.find(query).populate('classId academicYearId');
        res.json(exams);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getResultsByExam = async (req, res) => {
    try {
        const results = await Result.find({ examId: req.params.examId }).populate('studentId', 'firstName lastName admissionNumber');
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createExam, submitResult, getExams, getResultsByExam };
