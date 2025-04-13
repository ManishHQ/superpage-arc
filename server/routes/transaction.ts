import express from 'express';
import {
	createTransaction,
	getUserTransaction,
} from '../controllers/transaction';
import { isLoggedIn } from 'controllers/auth';

const router = express.Router();

router.post('/', createTransaction);
router.get('/me', isLoggedIn, getUserTransaction);

export default router;
