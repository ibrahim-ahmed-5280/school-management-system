const AcademicYear = require('../models/AcademicYear');
const Class = require('../models/Class');

// @desc    Create Academic Year
// @route   POST /api/academic/years
const createAcademicYear = async (req, res) => {
    const { name, startDate, endDate, isCurrent } = req.body;
    try {
        if (isCurrent) {
            await AcademicYear.updateMany({ tenantId: req.tenantId }, { isCurrent: false });
        }
        const year = await AcademicYear.create({
            tenantId: req.tenantId,
            name,
            startDate,
            endDate,
            isCurrent
        });
        res.status(201).json(year);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create Class
// @route   POST /api/academic/classes
const createClass = async (req, res) => {
    const { name, gradeLevel, branchId } = req.body;
    try {
        const newClass = await Class.create({
            tenantId: req.tenantId,
            branchId: branchId || req.branchId,
            name,
            gradeLevel
        });
        res.status(201).json(newClass);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAcademicYears = async (req, res) => {
    try {
        const years = await AcademicYear.find({ tenantId: req.tenantId });
        res.json(years);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getClasses = async (req, res) => {
    try {
        const query = { tenantId: req.tenantId };
        if (req.branchId) query.branchId = req.branchId;
        const classes = await Class.find(query);
        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createAcademicYear, createClass, getAcademicYears, getClasses };
