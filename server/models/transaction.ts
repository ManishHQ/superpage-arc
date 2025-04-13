import mongoose from 'mongoose';

interface Transaction {
	to: mongoose.Schema.Types.ObjectId;
	amount: number;
	message: string;
}

const transactionSchema = new mongoose.Schema<Transaction>(
	{
		to: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		amount: {
			type: Number,
			required: true,
		},
		message: {
			type: String,
			required: true,
		},
	},
	{ timestamps: true }
);

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
