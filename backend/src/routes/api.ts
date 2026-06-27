import { Router } from 'express';
import multer from 'multer';
import { signup, login } from '../controllers/AuthController';
import { getDailyTest, getIntervalTest, getMockTest, submitTest, getLeaderboard } from '../controllers/TestController';
import { uploadQuestions, getAdminUsers, getAdminAttempts } from '../controllers/AdminController';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware';

const upload = multer({ dest: 'uploads/' });
const router = Router();

// --- Auth Routes ---
router.post('/auth/signup', signup);
router.post('/auth/login', login);

// --- Test Routes (User Auth required) ---
router.get('/tests/daily', requireAuth, getDailyTest);
router.get('/tests/interval', requireAuth, getIntervalTest);
router.get('/tests/mock/:id', requireAuth, getMockTest);
router.post('/tests/submit', requireAuth, submitTest);

// --- Leaderboard Route (User Auth required) ---
router.get('/leaderboard', requireAuth, getLeaderboard);

// --- Admin Routes (Admin Auth required) ---
router.post('/admin/upload-questions', requireAuth, requireAdmin, upload.single('file'), uploadQuestions);
router.get('/admin/users', requireAuth, requireAdmin, getAdminUsers);
router.get('/admin/attempts', requireAuth, requireAdmin, getAdminAttempts);

export default router;
