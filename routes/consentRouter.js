import express from "express";
import { 
  createConsentRequest,
  getParentConsents,
  respondToConsent,
  getTeacherConsents,
  getAdminConsents,
  getConsentResponses,
} from "../controllers/consentController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/create",authMiddleware(["admin", "parent", "teacher"]), createConsentRequest);
router.get("/my-consents",authMiddleware(["admin", "parent", "teacher"]), getParentConsents);
router.put("/respond", authMiddleware(["admin", "parent", "teacher"]), respondToConsent);
router.get("/teacher", authMiddleware(["teacher"]), getTeacherConsents);
router.get("/admin", authMiddleware(["admin"]), getAdminConsents);
router.get("/responses/:consentId", authMiddleware(["admin", "teacher"]), getConsentResponses);

export default router;