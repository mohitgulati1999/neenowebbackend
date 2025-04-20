import mongoose from "mongoose";
const feeReminderNotificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId, // References Student or User (parent) collection
      required: true,
      refPath: "recipientType", // Dynamically references based on recipientType
    },
    recipientType: {
      type: String,
      enum: ["student", "parent"],
      required: true,
      default: "student",
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      default: "Fee Payment Reminder",
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    feePaymentId: {
      type: mongoose.Schema.Types.ObjectId, // References FeePayment collection
      required: true,
      ref: "FeePayment",
    },
    dueDate: {
      type: String, // Stored as "YYYY-MM-DD" to match your FeePayment dueDate
      required: true,
    },
    amountDue: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["unread", "read", "dismissed"],
      default: "unread",
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

export default mongoose.model("FeeReminderNotification", feeReminderNotificationSchema);
