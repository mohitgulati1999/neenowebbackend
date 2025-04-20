import express from 'express';
import * as feesTypeController from '../controllers/feesTypeController.js';

const router = express.Router();
import authMiddleware from '../middleware/auth.js';
// Fees Type Routes
router.post('/', authMiddleware(["admin", "parent", "teacher"]), feesTypeController.createFeesType);
router.get('/', authMiddleware(["admin", "parent", "teacher"]), feesTypeController.getAllFeesTypes);
router.get('/:id', authMiddleware(["admin", "parent", "teacher"]), feesTypeController.getFeesTypeById);
router.put('/:id', authMiddleware(["admin", "parent", "teacher"]), feesTypeController.updateFeesType);
router.delete('/:id', authMiddleware(["admin", "parent", "teacher"]), feesTypeController.deleteFeesType);
router.get('/group/:feesGroupId', authMiddleware(["admin", "parent", "teacher"]), feesTypeController.getFeesListByGroup)

export default router;