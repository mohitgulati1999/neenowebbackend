// models/studentFee.js
import mongoose from "mongoose";

const studentFeeSchema = new mongoose.Schema({
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
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
  feeTemplateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FeesTemplate",
    required: true,
  },
  customFees: [
    {
      feesGroup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FeesGroup",
        required: true,
      },
      feeTypes: [
        {
          feesType: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FeesType",
            required: true,
          },
          amount: {
            type: Number,
            required: true,
            min: 0,
          },
          originalAmount: { // New field to track the template's original amount
            type: Number,
            required: true,
            min: 0,
          },
          discount: { // New field for discount amount or percentage
            type: Number,
            default: 0,
            min: 0,
          },
          discountType: { // New field to specify if discount is fixed or percentage
            type: String,
            enum: ["fixed", "percentage"],
            default: "fixed",
          },
          dueDate: { // New field for due date
            type: Date,
            required: true, // Make it required if you want to enforce it
          },
        },
      ],
    },
  ],
});

export default mongoose.model("StudentFee", studentFeeSchema);