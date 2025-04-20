import express from "express";
import { addMeal, getMealPlan, editMeal, deleteMeal } from "../controllers/mealController.js";
import authMiddleware from "../middleware/auth.js";


const router = express.Router();

router.post("/add", authMiddleware(["admin", "parent", "teacher"]), addMeal);
router.get("/plan", authMiddleware(["admin", "parent", "teacher"]), getMealPlan);
router.put("/:id", authMiddleware(["admin"]), editMeal);
router.delete("/:id", authMiddleware(["admin"]), deleteMeal);

export default router;