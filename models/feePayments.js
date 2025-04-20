import mongoose from "mongoose";

const feePaymentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Session",
    required: true,
  },
  feesGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FeesGroup",
    required: true,
  },
  feesTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FeesType",
    required: true,
  },
  amountDue: {
    type: Number,
    required: true,
    min: 0,
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  paymentDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ["Pending", "Paid", "Overdue"],
    default: "Pending",
  },
  reminderSent: {
    type: Boolean,
    default: false,
  },
  reminderDate: {
    type: Date,
  },
});

export default mongoose.model("FeePayments", feePaymentSchema);