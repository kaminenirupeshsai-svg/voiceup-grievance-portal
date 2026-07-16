// routes/admin.js
const express = require('express');
const router = express.Router();
const requireAdmin = require('../middleware/requireAdmin');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { Parser } = require('json2csv');
const { notifyStudentStatusChange } = require('../utils/notify');

// Helper: normalize status strings used in UI/DB
const STATUS = {
  PENDING: 'Pending',
  IN_PROCESS: 'In Process',
  RESOLVED: 'Resolved',
  ESCALATED: 'Escalated'
};

// Admin dashboard with filters, search, pagination
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const { filter = 'all', q = '', page = 1, per = 20 } = req.query;
    const perNum = Math.max(1, parseInt(per, 10) || 20);
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const skip = (pageNum - 1) * perNum;

    const query = { deleted: { $ne: true } };

    if (filter === 'pending') query.status = STATUS.PENDING;
    else if (filter === 'inprocess') query.status = STATUS.IN_PROCESS;
    else if (filter === 'resolved') query.status = STATUS.RESOLVED;
    else if (filter === 'escalated') query.status = STATUS.ESCALATED;

    if (q && q.trim()) {
      const kw = new RegExp(q.trim(), 'i');
      // search by title, description, category, _id
      query.$or = [
        { title: kw },
        { description: kw },
        { category: kw },
        { _id: q.trim() } // allow direct id search
      ];
    }

    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .populate('student', 'name email roll department')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perNum)
      .lean();

    // summary counts
    const summaryData = await Complaint.aggregate([
      { $match: { deleted: { $ne: true } } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    const summary = {
      [STATUS.PENDING]: 0,
      [STATUS.IN_PROCESS]: 0,
      [STATUS.RESOLVED]: 0,
      [STATUS.ESCALATED]: 0
    };
    summaryData.forEach(s => { summary[s._id] = s.count; });

    // fetch officer list for assignment dropdown
    const officers = await User.find({ role: 'officer' }).sort({ name: 1 }).select('name email').lean();

    res.render('admin-dashboard', {
      complaints,
      total,
      summary,
      filter,
      q,
      page: pageNum,
      per: perNum,
      officers,
      role: 'admin',
      active: 'dashboard'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Error loading admin dashboard: ' + err.message);
  }
});

// Complaint detail view
router.get('/complaints/:id', requireAdmin, async (req, res) => {
  try {
    const c = await Complaint.findById(req.params.id)
      .populate('student', 'name email roll department')
      .populate('assignedTo', 'name email')
      .lean();
    if (!c) return res.status(404).send('Complaint not found');
    // ensure remarks array exists
    c.remarks = c.remarks || [];
    res.render('admin-complaint-view', { complaint: c, role: 'admin', active: 'dashboard' });
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ ' + err.message);
  }
});

// Assign complaint to officer or department
router.post('/assign', requireAdmin, async (req, res) => {
  try {
    const { id, assignedTo, assignedDepartment } = req.body;
    const adminName = req.session.user?.name || 'Admin';

    // Note: findByIdAndUpdate ignores $push if update is not constructed properly; use two ops
    await Complaint.findByIdAndUpdate(id, { $set: { assignedTo: assignedTo || null, assignedDepartment: assignedDepartment || null }});
    await Complaint.findByIdAndUpdate(id, { $push: { history: { by: adminName, action: 'Assigned', assignedTo: assignedTo || null, assignedDepartment: assignedDepartment || null, at: new Date() } }});
    res.redirect('back');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ ' + err.message);
  }
});

// Resolve complaint (force)
router.post('/resolve', requireAdmin, async (req, res) => {
  try {
    const { id } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      id,
      { status: STATUS.RESOLVED, resolvedAt: new Date(), $push: { history: { by: req.session.user.name, action: 'Resolved', at: new Date() } } },
      { new: true }
    ).populate('student', 'email');

    if (complaint) {
      notifyStudentStatusChange(complaint, complaint.student?.email).catch(() => {});
    }

    res.redirect('back');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ ' + err.message);
  }
});

// Escalate complaint
router.post('/escalate', requireAdmin, async (req, res) => {
  try {
    const { id } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      id,
      { status: STATUS.ESCALATED, escalatedAt: new Date(), $push: { history: { by: req.session.user.name, action: 'Escalated', at: new Date() } } },
      { new: true }
    ).populate('student', 'email');

    if (complaint) {
      notifyStudentStatusChange(complaint, complaint.student?.email).catch(() => {});
    }

    res.redirect('back');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ ' + err.message);
  }
});

// Add admin remark
router.post('/remark', requireAdmin, async (req, res) => {
  try {
    const { id, remark } = req.body;
    if (!remark || !remark.trim()) return res.redirect('back');
    const by = req.session.user?.name || 'Admin';
    await Complaint.findByIdAndUpdate(id, { $push: { remarks: { by, text: remark, at: new Date() }, history: { by, action: 'Remark', at: new Date(), note: remark } }});
    res.redirect('back');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ ' + err.message);
  }
});

// Soft-delete complaint
router.post('/delete', requireAdmin, async (req, res) => {
  try {
    const { id } = req.body;
    await Complaint.findByIdAndUpdate(id, { deleted: true, deletedAt: new Date(), $push: { history: { by: req.session.user.name, action: 'Deleted', at: new Date() } } });
    res.redirect('back');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ ' + err.message);
  }
});

// Export CSV
router.get('/export/csv', requireAdmin, async (req, res) => {
  try {
    const complaints = await Complaint.find({ deleted: { $ne: true } }).populate('student', 'name email').lean();
    const fields = ['_id', 'title', 'category', 'status', 'createdAt', 'resolvedAt', 'student.name', 'student.email'];
    const parser = new Parser({ fields });
    const csv = parser.parse(complaints);
    res.header('Content-Type', 'text/csv');
    res.attachment('complaints.csv');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ ' + err.message);
  }
});

// Admin Analytics Page
router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    const statusCounts = await Complaint.aggregate([
      { $match: { deleted: { $ne: true } } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const categoryCounts = await Complaint.aggregate([
      { $match: { deleted: { $ne: true } } },
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    // Complaints filed per day over the last 30 days
    const trend = await Complaint.aggregate([
      { $match: { deleted: { $ne: true }, createdAt: { $gte: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Average resolution time, overall and by category
    const resolutionByCategory = await Complaint.aggregate([
      { $match: { status: STATUS.RESOLVED, resolvedAt: { $ne: null } } },
      { $project: { category: 1, hours: { $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 1000 * 60 * 60] } } },
      { $group: { _id: "$category", avgHours: { $avg: "$hours" }, count: { $sum: 1 } } },
      { $sort: { avgHours: 1 } }
    ]);

    const overallResolution = await Complaint.aggregate([
      { $match: { status: STATUS.RESOLVED, resolvedAt: { $ne: null } } },
      { $project: { hours: { $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 1000 * 60 * 60] } } },
      { $group: { _id: null, avgHours: { $avg: "$hours" } } }
    ]);

    // Student satisfaction (feedback ratings)
    const ratingStats = await Complaint.aggregate([
      { $match: { "feedback.rating": { $exists: true, $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: "$feedback.rating" }, count: { $sum: 1 } } }
    ]);

    const totalComplaints = await Complaint.countDocuments({ deleted: { $ne: true } });

    res.render("admin-analytics", {
      statusCounts,
      categoryCounts,
      trend,
      resolutionByCategory,
      avgResolutionHours: overallResolution[0]?.avgHours || null,
      avgRating: ratingStats[0]?.avgRating || null,
      ratingCount: ratingStats[0]?.count || 0,
      totalComplaints,
      role: 'admin',
      active: 'analytics'
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Error loading analytics: " + err.message);
  }
});

/* -------------------------------------------
   USER MANAGEMENT (create staff accounts,
   change roles, remove users)
------------------------------------------- */
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ role: 1, name: 1 }).lean();
    res.render('admin-users', { users, role: 'admin', active: 'users', error: null });
  } catch (err) {
    res.status(500).send('❌ ' + err.message);
  }
});

router.get('/users/new', requireAdmin, (req, res) => {
  res.render('admin-user-new', { error: null, role: 'admin', active: 'users' });
});

router.post('/users/new', requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.render('admin-user-new', { error: 'A user with that email already exists.', role: 'admin', active: 'users' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email: email.trim().toLowerCase(), password: hashed, role, department, verified: true });

    res.redirect('/admin/users');
  } catch (err) {
    res.render('admin-user-new', { error: err.message, role: 'admin', active: 'users' });
  }
});

router.post('/users/:id/role', requireAdmin, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { role: req.body.role });
    res.redirect('/admin/users');
  } catch (err) {
    res.status(500).send('❌ ' + err.message);
  }
});

router.post('/users/:id/delete', requireAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/admin/users');
  } catch (err) {
    res.status(500).send('❌ ' + err.message);
  }
});

module.exports = router;
