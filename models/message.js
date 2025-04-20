import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipients: {
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // For direct messages (e.g., parent to admin/teacher)
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }], // Specific students
    classes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }], // All students in a class
  },
  subject: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  attachment: {
    type: String, // File path or URL
    default: null,
  },
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    readAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

export default mongoose.model("Message", messageSchema);