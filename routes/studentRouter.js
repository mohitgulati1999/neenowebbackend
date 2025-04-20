import express from "express";
import {
  getAllStudents,
  getStudentById,
  getStudentByFilter,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentsByClassAndSession,
  getStudentByAdmissionNumber
} from "../controllers/studentController.js";
const router = express.Router();

const restrictToAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};
import authMiddleware from "../middleware/auth.js";
// Public routes (authenticated users can access)
router.get("/", authMiddleware(["admin", "parent", "teacher"]), getAllStudents);
router.get("/:admissionNumber", authMiddleware(["admin", "parent", "teacher"]), getStudentById);
router.post("/filter", authMiddleware(["admin", "parent", "teacher"]), getStudentByFilter);

// Admin-only routes
router.post("/create", authMiddleware(["admin", "parent", "teacher"]), createStudent);
router.put("/:admissionNumber", authMiddleware(["admin", "parent", "teacher"]), updateStudent);
router.delete("/:admissionNumber", authMiddleware(["admin", "parent", "teacher"]), deleteStudent);
router.get("/admission/:admissionNumber", authMiddleware(["admin", "teacher", "parent"]), getStudentByAdmissionNumber);
router.get("/by-class-session/:classId/:sessionId", authMiddleware(["admin", "parent", "teacher"]), getStudentsByClassAndSession)
export default router;