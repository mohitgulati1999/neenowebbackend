import express from "express";
import {
  sendMessage,
  getInbox,
  getSentMessages,
  getAllClasses,
  getTeacherClasses,
  getAllStudents,
  getAdmins,
  getStudentByParent,
  getClassTeachers,
  // deleteMessages,
  getStudentByEmail
} from "../controllers/messageController.js";
import authMiddleware from "../middleware/auth.js";
const router = express.Router();

// Message actions
router.post("/send", authMiddleware(["admin", "parent", "teacher"]), sendMessage);
router.get("/inbox", authMiddleware(["admin", "parent", "teacher"]), getInbox);
router.get("/sent", authMiddleware(["admin", "parent", "teacher"]), getSentMessages);

// Supporting routes for recipient selection
router.get("/classes",authMiddleware(["admin", "parent", "teacher"]),  getAllClasses);
router.get("/classes/teacher/:teacherId", authMiddleware(["admin", "parent", "teacher"]), getTeacherClasses);
router.post("/students", authMiddleware(["admin", "parent", "teacher"]), getAllStudents);
router.get("/users/admins", authMiddleware(["admin", "parent", "teacher"]), getAdmins);
router.get("/students/parent/:parentId", authMiddleware(["admin", "parent", "teacher"]), getStudentByParent);
router.get("/classes/:classId/teachers", authMiddleware(["admin", "parent", "teacher"]), getClassTeachers);
// router.delete('/delete', deleteMessages);
router.get('/students/by-email', authMiddleware(["admin", "parent", "teacher"]), getStudentByEmail);

export default router;