const mongoose = require('mongoose');
require('dotenv').config();

const fixLegacyIndexes = async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/school_management';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);

    try {
        await mongoose.connect(mongoUri);
        console.log('MongoDB Connected successfully.');

        const db = mongoose.connection.db;

        // Fetch all collections in the database
        const collections = await db.collections();
        console.log(`Auditing ${collections.length} collections for legacy schoolId indexes...`);

        for (const coll of collections) {
            const collName = coll.collectionName;
            const indexes = await coll.indexes();
            
            for (const idx of indexes) {
                if (idx.name === '_id_') continue;
                
                // Check if index keys contain 'schoolId'
                const hasSchoolId = idx.key && ('schoolId' in idx.key);
                
                if (hasSchoolId) {
                    console.log(`Dropping obsolete index '${idx.name}' from collection '${collName}'`);
                    await coll.dropIndex(idx.name).catch(err => {
                        console.error(`Failed to drop index '${idx.name}' from collection '${collName}':`, err.message);
                    });
                }
            }
        }

        // Additional drop checks for specific obsolete indexes if they still linger
        const specificDrops = [
            { coll: 'students', name: 'schoolId_1_admissionNumber_1' },
            { coll: 'students', name: 'schoolId_1_branchId_1' },
            { coll: 'users', name: 'schoolId_1_email_1' },
            { coll: 'attendancerecords', name: 'schoolId_1_branchId_1_timetableSlotId_1_date_1' },
            { coll: 'payments', name: 'tenantId_1_branchId_1_receiptNumber_1' },
            { coll: 'subjects', name: 'schoolId_1_code_1' },
            { coll: 'academicyears', name: 'schoolId_1_name_1' },
            { coll: 'invoices', name: 'tenantId_1_branchId_1_studentId_1_academicYearId_1' }
        ];

        for (const spec of specificDrops) {
            try {
                const coll = db.collection(spec.coll);
                const idxs = await coll.indexes();
                if (idxs.some(i => i.name === spec.name)) {
                    console.log(`Dropping specific obsolete index '${spec.name}' from '${spec.coll}'`);
                    await coll.dropIndex(spec.name);
                }
            } catch (err) {
                // Ignore if collection or index is already dropped
            }
        }

        // Sync new model schemas
        console.log('Synchronizing new tenant-based indexes...');
        
        // Import models to register schema definitions
        const Student = require('../models/Student');
        const User = require('../models/User');
        const AttendanceRecord = require('../models/AttendanceRecord');
        const AttendanceSession = require('../models/AttendanceSession');
        const Payment = require('../models/Payment');
        const Subject = require('../models/Subject');
        const AcademicYear = require('../models/AcademicYear');
        const Invoice = require('../models/Invoice');
        const Term = require('../models/Term');

        await db.collection('invoices').updateMany(
            { billingPeriodKey: { $exists: false } },
            { $set: { billingPeriodKey: 'YEARLY', billingPeriodLabel: 'Annual' } }
        );

        await Student.syncIndexes();
        console.log("Indexes synchronized for model 'Student'.");

        await User.syncIndexes();
        console.log("Indexes synchronized for model 'User'.");

        await AttendanceRecord.syncIndexes();
        console.log("Indexes synchronized for model 'AttendanceRecord'.");

        await AttendanceSession.syncIndexes();
        console.log("Indexes synchronized for model 'AttendanceSession'.");

        await Payment.syncIndexes();
        console.log("Indexes synchronized for model 'Payment'.");

        await Subject.syncIndexes();
        console.log("Indexes synchronized for model 'Subject'.");

        await AcademicYear.syncIndexes();
        console.log("Indexes synchronized for model 'AcademicYear'.");

        await Invoice.syncIndexes();
        console.log("Indexes synchronized for model 'Invoice'.");

        await Term.syncIndexes();
        console.log("Indexes synchronized for model 'Term'.");

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error during index migration:', error);
        process.exit(1);
    }
};

fixLegacyIndexes();
