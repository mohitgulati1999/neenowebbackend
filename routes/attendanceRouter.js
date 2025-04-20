// routes/attendance.js
import express from "express";
import {
  markAttendance, getStudentAttendanceAndCCTV, getClassStudentsForAttendance, getStudentAttendanceByPeriod
} from "../controllers/attendanceController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware(["teacher", "parent", "admin"]), markAttendance); // Mark in/out
router.get("/:studentId/:date", authMiddleware(["teacher", "parent", "admin"]), getStudentAttendanceAndCCTV); // Parent view
router.get("/class/:classId/:date", authMiddleware(["teacher", "parent", "admin"]), getClassStudentsForAttendance); // Teacher view all students
router.get("/student/:studentId/period", authMiddleware(["teacher", "parent", "admin"]), getStudentAttendanceByPeriod);
export default router;