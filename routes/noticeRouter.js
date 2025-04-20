import express from "express";
import { addNotice, getNotices, getNoticesByRole, updateNotice, deleteNotice } from "../controllers/noticeController.js";
import authMiddleware from "../middleware/auth.js";
const router = express.Router();

// Add a new notice
router.post("/", authMiddleware(["admin", "parent", "teacher"]), addNotice);

// Get all notices
router.get("/", authMiddleware(["admin", "parent", "teacher"]), getNotices);

// Get notices for a specific role
router.get("/role/:role", authMiddleware(["admin", "parent", "teacher"]), getNoticesByRole);

// Update a notice
router.put("/:id", authMiddleware(["admin", "parent", "teacher"]), updateNotice);

// Delete a notice
router.delete("/:id", authMiddleware(["admin", "parent", "teacher"]), deleteNotice);

export default router;