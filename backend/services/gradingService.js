const GradingPolicy = require('../models/GradingPolicy');

/**
 * Default grading rules if tenant hasn't configured any
 */
const DEFAULT_RULES = [
    { min: 90, max: 100, grade: 'A' },
    { min: 80, max: 89, grade: 'B' },
    { min: 70, max: 79, grade: 'C' },
    { min: 60, max: 69, grade: 'D' },
    { min: 0, max: 59, grade: 'F' }
];

/**
 * Computes Total and Grade for a set of subjects
 * @param {string} tenantId 
 * @param {Array} subjects - [{ name, score }]
 * @returns {Object} { total, grade }
 */
exports.calculateResult = async (tenantId, subjects) => {
    // 1. Compute Total
    const total = subjects.reduce((sum, s) => sum + s.score, 0);
    
    // 2. Compute Percentage (assuming each subject is out of 100)
    const percentage = subjects.length > 0 ? (total / (subjects.length * 100)) * 100 : 0;

    // 3. Fetch Policy
    const policy = await GradingPolicy.findOne({ tenantId });
    const rules = policy ? policy.rules : DEFAULT_RULES;

    // 4. Find Grade
    const grade = exports.gradeForPercentage(percentage, rules);

    return { total, grade };
};

exports.getGradingRules = async (tenantId) => {
    const policy = await GradingPolicy.findOne({ tenantId });
    return policy ? policy.rules : DEFAULT_RULES;
};

exports.gradeForPercentage = (percentage, rules = DEFAULT_RULES) => {
    const match = [...rules]
        .sort((a, b) => Number(b.min) - Number(a.min))
        .find((rule) => Number(percentage) >= Number(rule.min) && Number(percentage) <= Number(rule.max));
    return match?.grade || 'N/A';
};

exports.DEFAULT_RULES = DEFAULT_RULES;
