import mongoose from "mongoose";

const consentResponseSchema = new mongoose.Schema({
  consentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Consent", 
    required: true 
  },
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Student", 
    required: true 
  },
  parentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected"], 
    default: "pending" 
  },
  responseDate: { type: Date },
  respondedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }
}, { timestamps: true });

consentResponseSchema.index({ consentId: 1, studentId: 1 }, { unique: false });

export default mongoose.model("ConsentResponse", consentResponseSchema);