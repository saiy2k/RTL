import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { signMessage, verifyMessage } from '../../controllers/cln/message.js';
const router = Router();
router.post('/sign', isAuthenticated, signMessage);
router.post('/verify', isAuthenticated, verifyMessage);
export default router;
