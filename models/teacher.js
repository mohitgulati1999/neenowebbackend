// models/teacher.js
import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, 
  },
  id:{
    type: String,
    required: true
  },
  email:{
    type: String,
    required:true,
    unique: true
  },
  name: {
    type: String,
    required: true, 
  },
  dateOfBirth: {
    type: Date,
    required: true, 
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: "USA" },
  },

  joiningDate: {
    type: Date,
    required: true,
  },
  qualifications: [{
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    completionYear: { type: Number, required: true }, 
  }],
  experienceYears: {
    type: Number,
    required: true,
    min: 0,
  },
  subjects: [{
    type: String, 
  }],

  payroll: {
    epfNo: { type: String},
    basicSalary: { type: Number, required: true, min: 0 },
  },
  contractType: {
    type: String,
    enum: ["permanent", "temporary", "part-time", "contract"],
    required: true,
  },
  workShift: {
    type: String,
    enum: ["Morning", "Afternoon", "full-day", "flexible"],
    required: true,
  },
  workLocation: {
    type: String,
    required: true, 
  },
  dateOfLeaving: {
    type: Date,
  },
  languagesSpoken: [{
    type: String, 
  }],
  emergencyContact:{
    type: String, 
    required: true
  },
  bio: {
    type: String, 
    maxlength: 500,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});
teacherSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("Teacher", teacherSchema);