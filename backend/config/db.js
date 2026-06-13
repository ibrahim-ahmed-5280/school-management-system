const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Drop legacy teacher assignment index that blocks section-level assignments
        try {
            const collection = conn.connection.db.collection('teacherassignments');
            const indexes = await collection.indexes();
            const legacyIndexes = [
                'tenantId_1_classId_1_academicYearId_1_subject_1',
                'teacherUserId_1_classId_1_academicYearId_1'
            ];
            for (const name of legacyIndexes) {
                const legacy = indexes.find((idx) => idx.name === name);
                if (legacy) {
                    await collection.dropIndex(legacy.name);
                    console.log(`[DB MIGRATION] Dropped legacy index ${legacy.name}`);
                }
            }
        } catch (err) {
            console.warn('[DB MIGRATION] Failed to drop legacy teacher assignment index:', err.message);
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
