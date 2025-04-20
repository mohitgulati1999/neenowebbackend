import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  teacherId: [
    { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      required: true 
    }
  ],
  sessionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Session", 
    required: true 
  },
}, { timestamps: true });


export default mongoose.model("Class", classSchema);