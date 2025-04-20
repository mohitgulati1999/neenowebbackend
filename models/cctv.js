import mongoose from "mongoose";

const cctvSchema = new mongoose.Schema({
  channelId: {
    type: String,
    required: true,
    unique: true // e.g., "channel1", "channel2", ..., "channel8"
  },
  rtspUrl: {
    type: String,
    required: true // RTSP URL, e.g., "rtsp://username:password@camera_ip:port/stream"
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true // Links CCTV to a specific class
  },
  description: {
    type: String,
    default: "" // e.g., "Front Gate Camera", "Classroom 1"
  },
  active: {
    type: Boolean,
    default: true // Whether the channel is operational
  }
}, { timestamps: true });

export default mongoose.model("CCTV", cctvSchema);