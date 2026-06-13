const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true }, // e.g., 'basic', 'pro', 'enterprise'
  price: { type: mongoose.Schema.Types.Mixed, default: 0 }, // can be number or 'Custom'
  maxBranches: { type: mongoose.Schema.Types.Mixed, default: 1 }, // number or 'Unlimited'
  maxStudents: { type: mongoose.Schema.Types.Mixed, default: 100 },
  maxUsers: { type: mongoose.Schema.Types.Mixed, default: 50 },
  storage: { type: String, default: '5GB' },
  hasPrioritySupport: { type: Boolean, default: false },
  icon: { type: String, default: 'Zap' }, // Lucide icon name
  color: { type: String, default: 'text-blue-600' },
  bg: { type: String, default: 'bg-blue-50' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Plan', planSchema);
