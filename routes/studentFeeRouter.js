import express from "express";
import {
  getStudentsWithFees,
  editStudentFees,
  sendFeeReminder,
  getFeePaymentsBySession,
  collectFees,
  getReminders // New controller function
} from "../controllers/studentFeeController.js";
import mongoose from "mongoose";
const router = express.Router();
import authMiddleware from "../middleware/auth.js";
router.get("/students-fees", authMiddleware(["admin", "parent", "teacher"]), getStudentsWithFees); // Query params: sessionId, classId
router.put("/edit-student-fees", authMiddleware(["admin", "parent", "teacher"]), editStudentFees); // Body: { studentId, sessionId, customFees }
router.post("/send-reminder", authMiddleware(["admin", "parent", "teacher"]), sendFeeReminder); // Body: { studentId, sessionId, feesGroupId, feesTypeId }
router.get("/fee-payments/:sessionId", authMiddleware(["admin", "parent", "teacher"]), getFeePaymentsBySession); // New route
router.post("/collect", authMiddleware(["admin", "parent", "teacher"]), collectFees);
router.get("/reminders", authMiddleware(["admin", "parent", "teacher"]), getReminders); 
export default router;