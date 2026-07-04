const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  referenceId: { type: String, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  priority: { type: String, default: 'Medium' },
  anonymous: { type: Boolean, default: false },

  attachments: [
    {
      filename: String,       // stored name on disk
      originalName: String,   // name as uploaded by the user
      mimeType: String,
      size: Number
    }
  ],

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

  // STUDENT FEEDBACK (only after resolution)
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    submittedAt: { type: Date }
  },

  // SOFT DELETE
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },

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
