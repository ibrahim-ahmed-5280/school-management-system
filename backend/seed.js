const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tenant = require('./models/Tenant');
const Branch = require('./models/Branch');
const User = require('./models/User');

dotenv.config();

const seed = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/school_management';
        console.log('Connecting to:', uri);
        await mongoose.connect(uri);
        
        console.log('Cleaning...');
        await Promise.all([
            Tenant.deleteMany({}),
            Branch.deleteMany({}),
            User.deleteMany({})
        ]);

        console.log('Creating Tenant...');
        const tenant = await Tenant.create({
            name: 'Elite School',
            domain: 'elite',
            plan: 'enterprise',
            isApproved: true
        });

        console.log('Creating Branch...');
        const branch = await Branch.create({
            tenantId: tenant._id,
            name: 'Main Campus',
            code: 'MAIN'
        });

        console.log('Creating Users...');
        const password = process.env.SEED_PASSWORD;
        if (!password || password.length < 12) {
            throw new Error('Set SEED_PASSWORD to a value of at least 12 characters');
        }
        const userList = [
            { name: 'Admin', email: 'admin@school.com', passwordHash: password, role: 'super_admin', scope: 'tenant', tenantId: tenant._id, branchId: branch._id },
            { name: 'Teacher', email: 'teacher@school.com', passwordHash: password, role: 'teacher', scope: 'branch', tenantId: tenant._id, branchId: branch._id },
            { name: 'Cashier', email: 'cashier@school.com', passwordHash: password, role: 'cashier', scope: 'branch', tenantId: tenant._id, branchId: branch._id }
        ];

        for (const u of userList) {
            await User.create(u);
            console.log(`Created ${u.role}: ${u.email}`);
        }

        console.log('Seed Success!');
        process.exit(0);
    } catch (err) {
        console.error('SEED ERROR:', err);
        process.exit(1);
    }
};

seed();
