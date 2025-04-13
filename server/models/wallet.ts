// wallet information of the users
import mongoose from 'mongoose';

interface WalletOptions {
	transactionId?: string | null;
	walletPrivateKey: string;
	walletPublicKey: string;
	seedPhrase?: string;
	createdAt?: Date;
}

interface Wallet extends mongoose.Document {
	user: mongoose.Schema.Types.ObjectId;
	hedera: WalletOptions;
	stellar: WalletOptions;
	sui: WalletOptions;
}

const walletSchema = new mongoose.Schema<Wallet>({
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	hedera: {
		transactionId: String,
		walletPrivateKey: String,
		walletPublicKey: String,
		seedPhrase: String,
		createdAt: {
			type: Date,
			default: Date.now,
			required: true,
		},
	},
	stellar: {
		transactionId: String,
		walletPrivateKey: String,
		walletPublicKey: String,
		seedPhrase: String,
		createdAt: {
			type: Date,
			default: Date.now,
			required: true,
		},
	},
	sui: {
		transactionId: String,
		walletPrivateKey: String,
		walletPublicKey: String,
		seedPhrase: String,
		createdAt: {
			type: Date,
			default: Date.now,
			required: true,
		},
	},
});

const Wallet = mongoose.model<Wallet>('Wallet', walletSchema);
export default Wallet;
