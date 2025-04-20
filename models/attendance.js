import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true
  },
  date: {
    type: Date,
    required: true,
    index: true // For efficient date-based queries
  },
  inTime: {
    type: Date,
    default: null // Null until marked "in"
  },
  outTime: {
    type: Date,
    default: null // Null until marked "out"
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Teacher who marked it
    required: true
  },
  timetableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Timetable",
    required: false // Optional link to timetable
  },
  notes: {
    type: String,
    default: ""
  }
}, { timestamps: true });

// Helper method to check if student is currently "in"
attendanceSchema.methods.isStudentIn = function () {
  return this.inTime && !this.outTime;
};

export default mongoose.model("Attendance", attendanceSchema);