import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { getFaucetHost, requestSuiFromFaucetV1 } from '@mysten/sui/faucet';
import { MIST_PER_SUI } from '@mysten/sui/utils';

// Convert MIST to Sui
const formatBalance = (balance: any) => {
	return Number.parseInt(balance.totalBalance) / Number(MIST_PER_SUI);
};

// Main async function to properly handle async operations
async function main() {
	try {
		// replace <YOUR_SUI_ADDRESS> with your actual address, which is in the form 0x123...
		const MY_ADDRESS =
			'0xbe52013ad40c129e8b0af0dd879189c1d996192d6df51d62086ac626897fbc6a';

		// create a new SuiClient object pointing to the network you want to use
		const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

		// store the JSON representation for the SUI the address owns before using faucet
		const suiBefore = await suiClient.getBalance({
			owner: MY_ADDRESS,
		});

		console.log(`Balance before faucet: ${formatBalance(suiBefore)} SUI`);

		// Request funds from faucet
		// requestSuiFromFaucetV1({
		// 	// use getFaucetHost to make sure you're using correct faucet address
		// 	host: getFaucetHost('testnet'),
		// 	recipient: MY_ADDRESS,
		// })
		// 	.then((response) => {
		// 		console.log('Faucet response:', response);
		// 	})
		// 	.catch((error) => {
		// 		console.log('Faucet error:', error);
		// 	});

		// store the JSON representation for the SUI the address owns after using faucet
		const suiAfter = await suiClient.getBalance({
			owner: MY_ADDRESS,
		});

		// Output result to console.
		console.log(
			`Balance after faucet: ${formatBalance(suiAfter)} SUI. Hello, SUI!`
		);

		await suiClient
			.getAllCoins({
				owner: MY_ADDRESS,
			})
			.then((response) => {
				console.log('Coins:', response);
			})
			.catch((error) => {
				console.error('Error fetching coins:', error);
			});
	} catch (error) {
		console.error('Error:', error);
	}
}

// Execute the main function
main();
