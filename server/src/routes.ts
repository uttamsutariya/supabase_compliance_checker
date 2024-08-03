import { Router } from 'express';
import { authenticate, getSecret, logout } from './controllers/authController';
import { verifyToken } from './middlewares/authMiddleware';
import { connectSupabase } from './controllers/supabaseController';
import { syncCompliance, getCompliance } from './controllers/complianceController';

const router = Router();

router.post('/auth/google', authenticate);

router.use(verifyToken);
router.get('/auth/logout', logout);
router.get('/auth/secret', getSecret);
router.post('/connectSupabase', connectSupabase);
router.get('/syncCompliance', syncCompliance);
router.get('/getCompliance', getCompliance);

export default router;
