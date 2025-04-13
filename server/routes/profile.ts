import express from 'express';
import {
	createProfile,
	getProfileByUsername,
	getProfileByPlatformUsername,
	updateProfile,
	updateSocialLinks,
} from '../controllers/profile';
import { isLoggedIn } from '../controllers/auth';

const router = express.Router();

router.post('/', isLoggedIn, createProfile);
router.patch('/:username/socials', isLoggedIn, updateSocialLinks);
router.post('/:username', isLoggedIn, updateProfile);
router.get('/:username', getProfileByUsername);
router.post('/find/:username', getProfileByPlatformUsername);

export default router;
