const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tenant = require('./models/Tenant');
const Branch = require('./models/Branch');
const User = require('./models/User');
const Student = require('./models/Student');
const Enrollment = require('./models/Enrollment');
const Class = require('./models/Class');
const AcademicYear = require('./models/AcademicYear');
const ClassCategory = require('./models/ClassCategory');

dotenv.config();

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Create Tenant
        let tenant = await Tenant.findOne({ domain: 'edu.com' });
        if (!tenant) {
            tenant = await Tenant.create({
                name: 'EduNexus Academy',
                domain: 'edu.com',
                plan: 'enterprise',
                isApproved: true
            });
            console.log('Tenant created:', tenant.name);
        }

        // 2. Create Branch
        let branch = await Branch.findOne({ tenantId: tenant._id, code: 'MAIN' });
        if (!branch) {
            branch = await Branch.create({
                tenantId: tenant._id,
                name: 'Main Campus',
                code: 'MAIN',
                address: '123 Education St',
                phone: '555-0199'
            });
            console.log('Branch created:', branch.name);
        }

        // 3. Create Users for all roles
        const password = process.env.SEED_PASSWORD;
        if (!password || password.length < 12) {
            throw new Error('Set SEED_PASSWORD to a value of at least 12 characters');
        }
        const roles = [
            { role: 'super_admin', scope: 'tenant', email: 'superadmin@edu.com', name: 'Super Admin' },
            { role: 'finance_director', scope: 'tenant', email: 'finance@edu.com', name: 'Finance Director' },
            { role: 'branch_admin', scope: 'branch', email: 'branchadmin@edu.com', name: 'Branch Admin' },
            { role: 'teacher', scope: 'branch', email: 'teacher@edu.com', name: 'Senior Teacher' },
            { role: 'cashier', scope: 'branch', email: 'cashier@edu.com', name: 'Lead Cashier' },
            { role: 'registrar', scope: 'branch', email: 'registrar@edu.com', name: 'Registrar Officer' },
            { role: 'student', scope: 'branch', email: 'student@edu.com', name: 'John Doe' }
        ];

        for (const r of roles) {
            let user = await User.findOne({ email: r.email, tenantId: tenant._id });
            if (!user) {
                await User.create({
                    tenantId: tenant._id,
                    branchId: r.scope === 'branch' ? branch._id : undefined,
                    name: r.name,
                    email: r.email,
                    passwordHash: password, // The model middleware will hash this
                    role: r.role,
                    scope: r.scope
                });
                console.log(`User created: ${r.name} (${r.role})`);
            } else {
                console.log(`User already exists: ${r.name}`);
            }
        }

        // 4. Create Academic Year and Class for student
        let year = await AcademicYear.findOne({ tenantId: tenant._id, name: '2023-2024' });
        if (!year) {
            year = await AcademicYear.create({
                tenantId: tenant._id,
                name: '2023-2024',
                startDate: new Date('2023-09-01'),
                endDate: new Date('2024-06-30'),
                isCurrent: true
            });
        }

        let category = await ClassCategory.findOne({ tenantId: tenant._id, branchId: branch._id, name: 'Secondary' });
        if (!category) {
            category = await ClassCategory.create({
                tenantId: tenant._id,
                branchId: branch._id,
                name: 'Secondary',
                description: 'Secondary School Classes'
            });
        }

        let cls = await Class.findOne({ tenantId: tenant._id, name: 'Grade 10-A' });
        if (!cls) {
            cls = await Class.create({
                tenantId: tenant._id,
                branchId: branch._id,
                categoryId: category._id,
                name: 'Grade 10-A',
                gradeLevel: 'Senior Secondary'
            });
        }

        // 5. Admit Student
        let student = await Student.findOne({ tenantId: tenant._id, admissionNumber: 'ADM-001' });
        if (!student) {
            student = await Student.create({
                tenantId: tenant._id,
                branchId: branch._id,
                admissionNumber: 'ADM-001',
                studentCode: 'STD-001',
                firstName: 'John',
                lastName: 'Doe',
                DOB: new Date('2010-05-15'),
                gender: 'Male',
                guardianInfo: { name: 'Richard Doe', phone: '555-0001', address: '123 Guardian Way', relationship: 'Father' }
            });
            
            await Enrollment.create({
                tenantId: tenant._id,
                branchId: branch._id,
                studentId: student._id,
                classId: cls._id,
                academicYearId: year._id,
                status: 'active'
            });
            console.log('Student created: John Doe (ADM-001)');
        }

        console.log('\n--- SEEDING COMPLETE ---');
        console.log('Use the following credentials to login:');
        console.log('All seeded users use the password supplied in SEED_PASSWORD.\n');
        roles.forEach(r => {
            console.log(`${r.role.padEnd(20)}: ${r.email}`);
        });
        console.log('------------------------');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

seed();
