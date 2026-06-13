/**
 * Migration: add primaryColor + secondaryColor to platform settings.
 * Run once: node scripts/fix-platform-settings.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';

async function run() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const PlatformSetting = require('../models/PlatformSetting');

    const result = await PlatformSetting.updateMany(
        {},
        {
            $set: {
                platformName:    'MadrasaHub',
                officialWebsite: 'https://madrasahub.com',
                primaryColor:    '#1b2a4a',
                secondaryColor:  '#4477f5',
                supportEmail:    'support@madrasahub.com',
                senderEmail:     'noreply@madrasahub.com',
            },
            $unset: { brandColor: '' }  // remove old field if present
        },
        { upsert: true }
    );

    console.log(`Updated ${result.modifiedCount} document(s). Upserted: ${result.upsertedCount}`);
    await mongoose.disconnect();
    console.log('Done.');
}

run().catch(err => { console.error(err); process.exit(1); });
