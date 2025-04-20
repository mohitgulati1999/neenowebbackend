import express from "express";
import {
  createSession,
  getAllSessions,
  getSessionById,
  updateSession,
  deleteSession,
} from "../controllers/sessionController.js"; // Adjust the import path as needed
import authMiddleware from "../middleware/auth.js";
const router = express.Router();

router.post("/create", authMiddleware(["admin", "parent", "teacher"]), createSession);
router.get("/get", authMiddleware(["admin", "parent", "teacher"]), getAllSessions);
router.get("/get/:id", authMiddleware(["admin", "parent", "teacher"]), getSessionById);
router.put("/update/:id", authMiddleware(["admin", "parent", "teacher"]), updateSession);
router.delete("/delete/:id", authMiddleware(["admin", "parent", "teacher"]), deleteSession);

export default router;