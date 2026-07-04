const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  roll: String,
  email: { type: String, unique: true },
  department: String,
  password: String,       // ⭐ plain password (NO hashing)
  role: {
    type: String,
    enum: ["student", "admin", "grievance", "officer"],
    default: "student",
  }
});

module.exports = mongoose.model("User", userSchema);
