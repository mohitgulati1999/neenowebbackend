import mongoose from "mongoose";

const consentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  sessionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Session", 
    required: true 
  },
  classId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Class", 
    required: true 
  },
}, { timestamps: true });

export default mongoose.model("Consent", consentSchema);