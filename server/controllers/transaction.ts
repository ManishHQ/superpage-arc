import catchAsync from 'utils/catchAsync';
import { Request, Response, NextFunction } from 'express';
import Transaction from '../models/transaction';
import { RequestWithAuth } from 'types/request';

export const createTransaction = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const { from, to, amount, message } = req.body;
		const transaction = await Transaction.create({
			to,
			amount,
			message,
		});

		res.status(201).json({
			status: 'success',
			data: {
				transaction,
			},
		});
	}
);

export const getUserTransaction = catchAsync(
	async (req: RequestWithAuth, res: Response, next: NextFunction) => {
		const userId = req.auth.id;
		const transactions = await Transaction.find({
			to: userId,
		}).sort({ createdAt: -1 });

		res.status(200).json({
			status: 'success',
			data: {
				transactions,
			},
		});
	}
);
