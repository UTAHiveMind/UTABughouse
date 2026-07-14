const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Schema = mongoose.Schema;

const availabilitySchema = new Schema({
  day: { type: String, required: true }, // e.g., "Monday"
  startTime: { type: String, required: true }, // Store as "HH:mm"
  endTime: { type: String, required: true }, // Store as "HH:mm"
});

const userSchema = new Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: function () {
      return !this.isSSO; // Require phone number only if NOT an SSO user
    },
  },
  email: {
    type: String,
    required: true,
    unique: true, // Ensure email is unique
  },
  password: {
    type: String,
    required: function () {
      return !this.isSSO; // Require password only if NOT an SSO user
    },
  },
  isSSO: {
    type: Boolean,
    default: false, // Default is false; set to true for SSO users
  },
  role: {
    type: String,
    enum: ["Admin", "Tutor", "Student"], // Role options
    default: "Student", // Default role is Student
  },
  rating: {
    type: Number,
  },
  numberOfRating: {
    type: Number,
  },
  availability: [availabilitySchema],
  cardID: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple docs with `null` cardID
  },
  studentID: {
    type: String,
    unique: true,
    sparse: true, // Optional student number for lookup and attendance
  },

  resetPasswordToken:   { type: String }, // Forgot password properties
  resetPasswordExpires: { type: Date   },
});

// Pre-save hook to hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password") && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Method to compare passwords during login
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;