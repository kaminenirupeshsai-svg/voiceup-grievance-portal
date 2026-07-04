const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  referenceId: { type: String, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  priority: { type: String, default: 'Medium' },
  anonymous: { type: Boolean, default: false },
  attachment: { type: String, default: null },

  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // STATUS FLOW
  status: {
    type: String,
    enum: ['Pending', 'In Process', 'Resolved', 'Escalated'],
    default: 'Pending'
  },

  // ADMIN ASSIGNMENT
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedDepartment: { type: String, default: null },

  // OFFICER ASSIGNMENT (IMPORTANT FIX)
  officer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // TIMINGS (important for dashboard)
  inProcessAt: { type: Date, default: null },
  escalatedAt: { type: Date, default: null },
  resolvedAt: { type: Date, default: null },

  // REMARKS / FEEDBACK
  remarks: [
    {
      by: { type: String },
      role: { type: String },     // 'Admin' | 'Officer' | 'System'
      text: { type: String },
      at: { type: Date, default: Date.now }
    }
  ],

  // ACTION HISTORY (assignment/resolve/escalate/delete/remark audit trail)
  history: [
    {
      by: { type: String },
      action: { type: String },
      assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      assignedDepartment: { type: String },
      note: { type: String },
      at: { type: Date, default: Date.now }
    }
  ],

}, { timestamps: true });

// AUTO REFERENCE ID
ComplaintSchema.pre('save', function(next) {
  if (!this.referenceId) {
    const random = Math.floor(1000 + Math.random() * 9000);
    const short = this.title ? this.title.slice(0, 3).toUpperCase() : 'EG';
    this.referenceId = `EG-${Date.now().toString().slice(-6)}-${random}-${short}`;
  }
  next();
});

module.exports = mongoose.model('Complaint', ComplaintSchema);
