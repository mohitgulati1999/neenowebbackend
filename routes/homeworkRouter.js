import express from "express";
import { getHomework, addHomework, editHomework, deleteHomework} from "../controllers/homeworkController.js";
import authMiddleware from "../middleware/auth.js";
const router = express.Router();

router.get("/", authMiddleware(["admin", "parent", "teacher"]), getHomework);
router.post("/add", authMiddleware(["admin", "parent", "teacher"]), addHomework);
router.put("/:id", authMiddleware(["admin", "parent", "teacher"]), editHomework);
router.delete("/:id",authMiddleware(["admin", "parent", "teacher"]), deleteHomework);

export default router;