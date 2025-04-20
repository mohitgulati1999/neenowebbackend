// import express from "express";
// import { signup, login } from "../controllers/authController.js";
// const router = express.Router();

// // Signup route
// router.post("/signup", signup);

// // Signin route
// router.post("/login", login);

// export default router;

import express from "express";
import { signup, login, adminSignup, searchParents } from "../controllers/authController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Public signup (parents and teachers)
router.post("/signup", signup);

// Admin-only signup (for any role)
router.post("/admin-signup", adminSignup);

// Login
router.post("/login", login);

// Parent search (authenticated, ideally admin-only)
router.get("/parents/search", searchParents);

export default router;