const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

mongoose.connect("mongodb://127.0.0.1:27017/egrievance")
  .then(() => console.log("DB Connected"))
  .catch(err => console.log(err));

async function createGrievanceOfficer() {
  await User.deleteOne({ email: "grievance@gmail.com" }); // Remove old wrong entry

  const hashedPassword = await bcrypt.hash("grievance123", 10);

  const user = new User({
    name: "Grievance Officer",
    roll: "GR001",
    email: "grievance@gmail.com",
    department: "Grievance Cell",
    password: hashedPassword,
    role: "grievance"
  });

  await user.save();

  console.log("✅ New Grievance Officer Created With Hashed Password!");
  process.exit();
}

createGrievanceOfficer();

