import axios from '@/lib/axios';

export interface LoginUser {
	identifier: string;
	password: string;
}

export interface RegisterUser {
	name: string;
	username: string;
	email: string;
	password: string;
	avatar: string;
	walletAddress: string;
}

export const login = async ({ identifier, password }: LoginUser) => {
	const response = await axios.post('/auth/login', {
		identifier,
		password,
	});
	return response.data;
};

export const register = async ({
	name,
	username,
	email,
	password,
	avatar,
	walletAddress,
}: RegisterUser) => {
	const response = await axios.post('/auth/register', {
		name,
		username,
		email,
		password,
		avatar,
		walletAddress,
	});
	return response.data;
};
