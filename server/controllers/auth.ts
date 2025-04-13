import user from '../models/user';
import { NextFunction, Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';
import { expressjwt } from 'express-jwt';
import jwt from 'jsonwebtoken';
import { RequestWithAuth } from 'types/request';
import { v2 as cloudinary } from 'cloudinary';

// register
const register = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const { avatar, name, username, email, password, walletAddress } = req.body;
		console.log('Request Body:', req.body);

		// Check if username or email already exists
		const [usernameExists, emailExists] = await Promise.all([
			user.findOne({ username: username.trim().toLowerCase() }),
			user.findOne({ email: email.trim().toLowerCase() }),
		]);

		if (usernameExists) {
			return next(AppError.badRequest('Username already exists'));
		}
		if (emailExists) {
			return next(AppError.badRequest('Email already exists'));
		}

		// Upload avatar to Cloudinary if provided
		let uploadedAvatarUrl = null;
		if (avatar) {
			const uploadResponse = await cloudinary.uploader.upload(avatar, {
				upload_preset: 'ml_default',
			});
			uploadedAvatarUrl = uploadResponse.secure_url;
			console.log('Uploaded Avatar URL:', uploadedAvatarUrl);
		}

		// Create new user
		const formattedName = name
			.trim()
			.split(' ')
			.map(
				(word: string) =>
					word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
			)
			.join(' ');

		const newUser = await user.create({
			name: formattedName,
			username: username.trim().toLowerCase(),
			email: email.trim().toLowerCase(),
			password,
			avatar: uploadedAvatarUrl,
			walletAddress: walletAddress.trim(),
		});

		// Generate JWT token
		const token = jwt.sign(
			{ id: newUser._id },
			process.env.JWT_SECRET as string,
			{
				expiresIn: '30d',
			}
		);

		res.status(201).json({
			status: 'success',
			message: 'User created successfully',
			data: newUser,
			token,
		});
	}
);

// login
const login = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		console.log('login', { body: req.body });
		const { identifier, password } = req.body;
		const existingUser = await user.findOne({
			$or: [{ username: identifier }, { email: identifier }],
		});
		console.log('existingUser', existingUser);
		if (!existingUser) {
			return next(new AppError('User not found', 404));
		}
		if (!(await existingUser.comparePassword(password))) {
			return next(new AppError('Invalid Credential', 401));
		}
		// generate and send JWT token
		const token = jwt.sign(
			{ id: existingUser._id },
			process.env.JWT_SECRET as string,
			{
				expiresIn: '30d',
			}
		);
		res.status(200).json({
			status: 'success',
			message: 'User signed in successfully',
			token: token,
			user: existingUser,
		});
	}
);

// get current user
const getCurrentUser = catchAsync(
	async (req: RequestWithAuth, res: Response, next: NextFunction) => {
		const userId = req.auth.id;
		const currentUser = await user.findById(userId);
		if (!currentUser) {
			return next(new AppError('User not found', 404));
		}
		res.status(200).json({
			status: 'success',
			message: 'User fetched successfully',
			data: currentUser,
		});
	}
);

// check if the user is logged in
const isLoggedIn = expressjwt({
	secret: (process.env.JWT_SECRET as string) || '',
	algorithms: ['HS256'],
	getToken: function (req: Request) {
		if (
			req.headers.authorization &&
			req.headers.authorization.startsWith('Bearer')
		) {
			return req.headers.authorization.split(' ')[1];
		}
		return undefined;
	},
});

export { login, register, getCurrentUser, isLoggedIn };
