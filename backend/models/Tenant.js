const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  domain: { type: String, required: true, unique: true },
  logoUrl: { type: String },
  primaryColor: { type: String, default: "#3b82f6" },
  secondaryColor: { type: String, default: "#1e40af" },
  plan: {
    type: String,
    default: "basic",
  },
  subscriptionLimits: {
      maxBranches: { type: Number, default: 1 },
      maxUsers: { type: Number, default: 10 },
      maxStudents: { type: Number, default: 50 }
  },
  isActive: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Tenant", tenantSchema);
