const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  roll: String,            // unique student ID — students log in with this
  email: { type: String, unique: true },
  mobile: String,          // registered mobile (for SMS OTP once a gateway is configured)
  department: String,
  password: String,       // bcrypt hash (set at registration / by admin)
  role: {
    type: String,
    enum: ["student", "admin", "grievance", "officer"],
    default: "student",
  },

  // EMAIL OTP VERIFICATION
  // `verified` is only set explicitly:
  //   false  -> student registered, OTP not yet confirmed (login blocked)
  //   true   -> OTP confirmed, or account created by an admin
  // Older accounts without the field are treated as verified.
  verified: { type: Boolean },
  otpHash: { type: String, default: null },      // sha256 of the 6-digit code
  otpExpires: { type: Date, default: null },
  otpAttempts: { type: Number, default: 0 },
  otpSentAt: { type: Date, default: null },
});

module.exports = mongoose.model("User", userSchema);
