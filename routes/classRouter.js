// routes/classRouter.js
import express from "express";
import {
  getAllClasses,
  createClass,
  getClassById,
  updateClass,
  deleteClass,
  getClassesBySession,
  getClassesForTeacher
} from "../controllers/classController.js"; // Adjust the import path based on your project structure
import authMiddleware from "../middleware/auth.js";
const router = express.Router();

// Route to get all classes
router.get("/", authMiddleware(["admin", "parent", "teacher"]), getAllClasses);

// Route to create a new class
router.post("/", authMiddleware(["admin", "parent", "teacher"]), createClass);

router.get("/teacher", authMiddleware(["admin", "parent", "teacher"]), getClassesForTeacher);
// Route to get a class by ID (user-entered id or MongoDB _id)
router.get("/:id", authMiddleware(["admin", "parent", "teacher"]), getClassById);

// Route to update a class by MongoDB _id
router.put("/:id", authMiddleware(["admin", "parent", "teacher"]), updateClass);

// Route to delete a class by MongoDB _id
router.delete("/:id", authMiddleware(["admin", "parent", "teacher"]), deleteClass);

// Route to get all classes for a specific session
router.get("/session/:sessionId", authMiddleware(["admin", "parent", "teacher"]), getClassesBySession);



export default router;