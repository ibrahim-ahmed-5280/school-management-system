/**
 * One-shot migration: update plans in MongoDB to English names.
 * Run once: node scripts/fix-plans.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/school_management';

const Plan = require('../models/Plan');

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    // Update basic plan
    const basicRes = await Plan.updateOne(
      { slug: 'basic' },
      { $set: { name: 'Free' } }
    );
    console.log('Updated basic plan:', basicRes);

    // Update pro plan
    const proRes = await Plan.updateOne(
      { slug: 'pro' },
      { $set: { name: 'Pro' } }
    );
    console.log('Updated pro plan:', proRes);

    // Update enterprise plan
    const entRes = await Plan.updateOne(
      { slug: 'enterprise' },
      { $set: { name: 'Enterprise' } }
    );
    console.log('Updated enterprise plan:', entRes);

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

run();
