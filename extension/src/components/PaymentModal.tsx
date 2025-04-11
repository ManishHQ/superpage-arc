// 🧠 Modern Tailwind UI/UX Tip Popup with Phantom Extension + QR toggle (TypeScript Friendly)
// ✨ Includes Solana Pay polling + clickable Solscan link + animations

import {
	encodeURL,
	createQR,
	findReference,
	validateTransfer,
} from '@solana/pay';
import { PublicKey, Connection, clusterApiUrl } from '@solana/web3.js';
import BigNumber from 'bignumber.js';

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

export const createPopup = (channelName: string) => {
	if (document.getElementById('superpage-popup')) return;
	console.log(`[SuperPay] Opening tip modal for ${channelName}`);
	const popup = document.createElement('div');
	popup.id = 'superpage-popup';
	popup.className =
		'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border border-purple-600 rounded-xl p-6 z-[9999] w-96 shadow-xl animate-fade-in';

	popup.innerHTML = `
	  <style>
	    @keyframes fade-in {
	      0% { opacity: 0; transform: translate(-50%, -60%) scale(0.95); }
	      100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
	    }
	    .animate-fade-in {
	      animation: fade-in 0.3s ease-out;
	    }
	  </style>
	  <h3 class="text-lg font-semibold mb-4 text-center">Tip ${channelName}</h3>
	  <input id="superpage-amount" type="number" placeholder="Amount in SOL" min="0.001" step="0.001"
	    class="w-full px-4 py-2 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500" />
	  <div class="flex justify-between mb-4">
	    <button id="superpage-use-extension" class="text-sm text-purple-600 underline">Use Phantom Extension</button>
	    <button id="superpage-send" class="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">Generate QR</button>
	  </div>
	  <div id="qr-code" class="hidden rounded-md overflow-hidden transition-all duration-300"></div>
	  <div id="solscan-link" class="hidden text-center mt-4">
	    <a href="#" target="_blank" class="text-sm text-green-600 underline">View on Solscan</a>
	  </div>
	  <div class="text-center mt-4">
	    <button id="superpage-cancel" class="text-gray-500 text-sm hover:underline">Cancel</button>
	  </div>
	`;
	document.body.appendChild(popup);

	document
		.getElementById('superpage-cancel')
		?.addEventListener('click', () => popup.remove());

	document
		.getElementById('superpage-use-extension')
		?.addEventListener('click', () => {
			const amountStr = (
				document.getElementById('superpage-amount') as HTMLInputElement
			).value;
			const amount = parseFloat(amountStr);
			if (!amount || amount < 0.001) {
				alert('Enter valid amount');
				return;
			}
			window.postMessage(
				{
					type: 'SUPERPAGE_TIP',
					recipient: 'CmtShTafYxCfpAehyvNacWXwGeG2RL9Nvp7T5Q2DheGj',
					lamports: amount * 1_000_000_000,
				},
				'*'
			);
			popup.remove();
		});

	document
		.getElementById('superpage-send')
		?.addEventListener('click', async () => {
			const amountStr = (
				document.getElementById('superpage-amount') as HTMLInputElement
			).value;
			const amount = parseFloat(amountStr);
			if (!amount || amount < 0.001) {
				alert('Enter valid amount');
				return;
			}

			const recipient = new PublicKey(
				'CmtShTafYxCfpAehyvNacWXwGeG2RL9Nvp7T5Q2DheGj'
			);
			const reference = new PublicKey('11111111111111111111111111111111');
			const url = encodeURL({
				recipient,
				amount: new BigNumber(amount),
				reference,
				label: 'SuperPay Tip',
				message: 'Thanks for the content!',
				memo: 'SuperPay',
			});

			const qr = createQR(url, 256);
			const qrContainer = document.getElementById('qr-code') as HTMLElement;
			qrContainer.innerHTML = '';
			qr.append(qrContainer);
			qrContainer.classList.remove('hidden');

			let intervalId: NodeJS.Timeout = setInterval(async () => {
				try {
					const sigInfo = await findReference(connection, reference);
					await validateTransfer(connection, sigInfo.signature, {
						recipient,
						amount: new BigNumber(amount),
					});
					clearInterval(intervalId);
					qrContainer.classList.add('hidden');

					const solscan = `https://solscan.io/tx/${sigInfo.signature}?cluster=devnet`;
					const linkElem = document.querySelector(
						'#solscan-link a'
					) as HTMLAnchorElement;
					linkElem.href = solscan;
					linkElem.textContent = '✅ View Transaction on Solscan';
					document.getElementById('solscan-link')?.classList.remove('hidden');
				} catch (err: any) {
					if (
						err.name !== 'ReferenceNotFoundError' &&
						err.name !== 'TransactionNotConfirmedError'
					) {
						console.error('[SuperPay] Poll error:', err);
					}
					// continue polling
				}
			}, 5000);
		});
};
