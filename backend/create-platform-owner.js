const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const createPlatformOwner = async () => {
    try {
        const email = String(process.env.PLATFORM_OWNER_EMAIL || '').trim().toLowerCase();
        const password = process.env.PLATFORM_OWNER_PASSWORD;
        const name = process.env.PLATFORM_OWNER_NAME || 'System Admin';
        if (!email || !password || password.length < 12) {
            throw new Error('Set PLATFORM_OWNER_EMAIL and a PLATFORM_OWNER_PASSWORD of at least 12 characters');
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            console.log('Platform Owner already exists');
            process.exit();
        }

        const user = await User.create({
            name,
            email,
            passwordHash: password, // Pre-save hook will hash this
            role: 'platform_owner',
            scope: 'platform',
            permissionProfile: 'default_platform_owner',
            isActive: true
            // tenantId is optional for platform_owner now
        });

        console.log(`Platform Owner created: ${user.email}`);
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

createPlatformOwner();
