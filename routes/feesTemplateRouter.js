import express from 'express';
import {
  createFeeTemplate,
  getAllFeeTemplates,
  getFeeTemplateById,
  updateFeeTemplate,
  deleteFeeTemplate,
  getClassesBySession,
  getFeeTemplatesForClass,
  assignFeesToStudents,
  getClassesWithTemplatesBySession,
  getAssignedStudents,
  getStudentFees
} from '../controllers/feesTemplateController.js';

const router = express.Router();
import authMiddleware from '../middleware/auth.js';
// CRUD Routes for FeeTemplate
router.post('/', authMiddleware(["admin", "parent", "teacher"]), createFeeTemplate);
router.get('/', authMiddleware(["admin", "parent", "teacher"]), getAllFeeTemplates); 
router.get('/:id', authMiddleware(["admin", "parent", "teacher"]), getFeeTemplateById);  
router.put('/:id', authMiddleware(["admin", "parent", "teacher"]), updateFeeTemplate);
router.delete('/:id', authMiddleware(["admin", "parent", "teacher"]), deleteFeeTemplate); 
router.get('/class/:classId', authMiddleware(["admin", "parent", "teacher"]), getFeeTemplatesForClass); 
router.get('/classes/session/:sessionId', authMiddleware(["admin", "parent", "teacher"]), getClassesBySession); 
router.post("/assign-fees-to-students", authMiddleware(["admin", "parent", "teacher"]), assignFeesToStudents);
router.get("/getTemplateInfoByClass/:sessionId", authMiddleware(["admin", "parent", "teacher"]), getClassesWithTemplatesBySession)
router.get('/get-assigned-students/:templateId/:sessionId', authMiddleware(["admin", "parent", "teacher"]), getAssignedStudents);
router.get("/student-fees/:studentId/:sessionId", authMiddleware(["admin", "parent", "teacher"]), getStudentFees);

export default router;