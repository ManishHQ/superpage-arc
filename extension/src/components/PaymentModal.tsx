import {
	encodeURL,
	createQR,
	findReference,
	validateTransfer,
} from '@solana/pay';

import { PublicKey, Connection, clusterApiUrl, Keypair } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { Buffer } from 'buffer';
import { getRecipientAddress } from '@/lib/getReciepientAddress';
// Make sure Buffer is available globally
if (typeof window !== 'undefined') {
	window.Buffer = Buffer;
}

// Solana connection for devnet or mainnet
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

export const createPopup = (username: string, platform: string) => {
	let loading = true;
	const recipient = getRecipientAddress(username, platform)
		.then((data) => {
			console.log('user: ', data);
			loading = false;
			return data.user.walletAddress;
		})
		.catch((error) => {
			console.error('Error fetching recipient address:', error);
			showToast('Error fetching recipient address. Please try again.', 'error');
			return null;
		});
	if (document.getElementById('superpage-popup')) return;
	console.log(`[SuperPay] Opening tip modal for ${username}`);

	const closePopup = () => {
		document.getElementById('superpage-backdrop')?.remove();
		popup.remove();
	};

	// if no recipient, show user is not registered in d-page
	if (!recipient) {
		showToast(
			'This user is not registered on SuperPay. Please try again later.',
			'error'
		);
		closePopup();
	}

	if (loading) {
		showToast('Loading recipient address...', 'info');
	}

	// Backdrop
	const backdrop = document.createElement('div');
	backdrop.id = 'superpage-backdrop';
	backdrop.style.cssText = `
			position: fixed; inset: 0;
			background: rgba(0, 0, 0, 0.5);
			z-index: 9998;
			backdrop-filter: blur(4px);
		`;
	document.body.appendChild(backdrop);

	// Modal
	const popup = document.createElement('div');
	popup.id = 'superpage-popup';
	popup.style.cssText = `
			position: fixed;
			top: 50%; left: 50%; transform: translate(-50%, -50%);
			background: white;
			border-radius: 12px;
			padding: 24px;
			z-index: 9999;
			width: 360px;
			box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
			animation: fade-in 0.3s ease;
		`;

	popup.innerHTML = `
			<style>
				@keyframes fade-in {
					0% { opacity: 0; transform: translate(-50%, -60%) scale(0.95); }
					100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
				}
				.qr-appear {
					animation: qr-appear 0.4s forwards;
				}
				@keyframes qr-appear {
					0% { opacity: 0; max-height: 0; }
					100% { opacity: 1; max-height: 300px; }
				}
				.super-btn {
					padding: 12px;
					border-radius: 8px;
					font-weight: bold;
					border: none;
					cursor: pointer;
					display: flex;
					align-items: center;
					justify-content: center;
					gap: 6px;
					width: 100%;
				}
				.super-btn.primary {
					background: linear-gradient(to right, #8b5cf6, #6366f1);
					color: white;
				}
				.super-btn.secondary {
					border: 1px solid #ccc;
					background: #fff;
					color: #333;
				}
			</style>
			<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
				<div style="display:flex;align-items:center;gap:8px">
					<div style="background:#8b5cf6;color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center">💸</div>
					<h3 style="margin:0;font-size:18px;font-weight:600">D-Page</h3>
				</div>
				<button id="superpage-close" style="background:none;border:none;color:#999;font-size:18px;">✕</button>
			</div>
			<div>
				<p style="text-align:center;color:#666;margin-bottom:16px">Send a tip to <strong style="color:#8b5cf6">${username}</strong></p>
				<label style="font-size:14px;color:#444">Amount</label>
				<div style="position:relative;margin-top:4px;margin-bottom:24px">
					<input id="superpage-amount" type="number" min="0.001" step="0.001" placeholder="0.05"
						style="width:100%;padding:10px 40px 10px 12px;border:1px solid #ccc;border-radius:8px;font-size:14px;">
					<span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:#999;font-size:14px;">SOL</span>
				</div>
			</div>
			<div style="display:flex;flex-direction:column;gap:12px">
				<button id="superpage-use-extension" class="super-btn primary">
					<span>Pay with Phantom Extension</span>
				</button>
				<button id="superpage-send" class="super-btn secondary">
					<span>Generate QR Code</span>
				</button>
			</div>
			<div id="qr-code" class="qr-appear" style="display:none;flex-direction:column;align-items:center;margin-top:24px">
				<div id="qr-img"></div>
				<p style="font-size:12px;color:#888;margin-top:8px">Scan with a Solana Pay compatible wallet</p>
			</div>
		`;
	document.body.appendChild(popup);

	document
		.getElementById('superpage-close')
		?.addEventListener('click', closePopup);
	backdrop.addEventListener('click', closePopup);

	// Make these changes in the existing file
	document
		.getElementById('superpage-use-extension')
		?.addEventListener('click', () => {
			const amountStr = (
				document.getElementById('superpage-amount') as HTMLInputElement
			).value;
			const amount = parseFloat(amountStr);
			if (!amount || amount < 0.001) {
				// Create toast notification instead of alert
				showToast('Please enter a valid amount (minimum 0.001 SOL)');
				return;
			}

			// Add transaction processing UI
			const btnElement = document.getElementById('superpage-use-extension');
			if (btnElement) {
				btnElement.innerHTML = `
                <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
            `;
				btnElement.setAttribute('disabled', 'true');
				btnElement.classList.add('opacity-75', 'cursor-not-allowed');
			}

			// Setup message listener for transaction result
			const transactionListener = (event: MessageEvent) => {
				if (event.data?.type === 'SUPERPAGE_TIP_RESULT') {
					window.removeEventListener('message', transactionListener);

					if (event.data.success) {
						// Transaction was successful
						const txid = event.data.tx;
						const solscanUrl = `https://solscan.io/tx/${txid}?cluster=devnet`;

						// Create a success message with Solscan link
						const statusContainer = document.createElement('div');
						statusContainer.className = 'mt-4 text-center';
						statusContainer.innerHTML = `
                        <div class="text-green-600 font-medium mb-2">Payment successful! ✓</div>
                        <a href="${solscanUrl}" target="_blank" 
                           class="block bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md text-center transition-colors duration-200 flex items-center justify-center">
                            <span>View transaction</span>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    `;

						// Insert the success message below the buttons
						const buttonsContainer = document.querySelector('.space-y-3');
						if (buttonsContainer) {
							buttonsContainer.parentNode?.insertBefore(
								statusContainer,
								buttonsContainer.nextSibling
							);
						}

						// Reset button state but keep it disabled
						if (btnElement) {
							btnElement.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                                <path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd" />
                            </svg>
                            Payment Completed
                        `;
						}

						// Show success toast
						showToast('Payment confirmed! Thank you.', 'success');

						// Keep the modal open for 5 seconds to allow clicking the Solscan link
						setTimeout(() => {
							document.getElementById('superpage-backdrop')?.remove();
							popup.remove();
						}, 5000);
					} else {
						// Transaction failed
						showToast(
							`Transaction failed: ${event.data.error || 'Unknown error'}`,
							'error'
						);

						// Reset button state
						if (btnElement) {
							btnElement.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                                <path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd" />
                            </svg>
                            Pay with Phantom Extension
                        `;
							btnElement.removeAttribute('disabled');
							btnElement.classList.remove('opacity-75', 'cursor-not-allowed');
						}
					}
				}
			};

			// Add the event listener before sending the message
			window.addEventListener('message', transactionListener);

			// Send the message to the injected script
			window.postMessage(
				{
					type: 'SUPERPAGE_TIP',
					recipient,
					lamports: amount * 1_000_000_000,
				},
				'*'
			);
		});

	document
		.getElementById('superpage-send')
		?.addEventListener('click', async () => {
			const amountStr = (
				document.getElementById('superpage-amount') as HTMLInputElement
			).value;
			const amount = parseFloat(amountStr);
			if (!amount || amount < 0.001) {
				showToast('Please enter a valid amount (minimum 0.001 SOL)');
				return;
			}

			try {
				// Generate a unique reference for this payment
				const reference = Keypair.generate().publicKey;
				const recipient = new PublicKey(
					await getRecipientAddress(username, platform)
						.then((data) => {
							return data.user.walletAddress;
						})
						.catch((error) => {
							console.error('Error fetching recipient address:', error);
							showToast(
								'Error fetching recipient address. Please try again.',
								'error'
							);
							return null;
						})
				);

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
				qrContainer.classList.replace('hidden', 'flex');
				qrContainer.classList.add('qr-appear');

				// Show status message
				const statusMsg = document.createElement('div');
				statusMsg.id = 'payment-status';
				statusMsg.className =
					'text-sm text-center text-gray-600 mt-2 animate-pulse';
				statusMsg.textContent = 'Waiting for payment...';
				qrContainer.appendChild(statusMsg);

				// Begin polling for transaction
				pollForTransaction(reference, recipient, amount, popup);
			} catch (error) {
				console.error('[SuperPay] QR generation error:', error);
				showToast('Error generating QR code. Please try again.', 'error');
			}
		});
};

// Function to poll for transaction completion
async function pollForTransaction(
	reference: PublicKey,
	recipient: PublicKey,
	amount: number,
	popupElement: HTMLElement
) {
	const statusElement = document.getElementById('payment-status');
	let paymentComplete = false;

	const interval = setInterval(async () => {
		try {
			if (statusElement) {
				statusElement.textContent = 'Checking for payment...';
				statusElement.classList.add('animate-pulse');
			}

			const signatureInfo = await findReference(connection, reference, {
				finality: 'confirmed',
			});

			if (signatureInfo) {
				await validateTransfer(connection, signatureInfo.signature, {
					recipient,
					amount: new BigNumber(amount),
					reference,
				});

				paymentComplete = true;
				clearInterval(interval);

				if (statusElement) {
					// Create success message with Solscan link
					const solscanUrl = `https://solscan.io/tx/${signatureInfo.signature}?cluster=devnet`;

					// Update the status element with a clickable success button
					statusElement.innerHTML = `
                        <a href="${solscanUrl}" target="_blank" class="block mt-2 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md text-center transition-colors duration-200 flex items-center justify-center">
                            <span>Payment successful! ✓</span>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    `;
					statusElement.classList.remove('animate-pulse', 'text-gray-600');
				}

				showToast('Payment confirmed! Thank you.', 'success');

				setTimeout(() => {
					document.getElementById('superpage-backdrop')?.remove();
					popupElement.remove();
				}, 5000); // Increased time to allow user to click the Solscan link
			}
		} catch (error: any) {
			if (
				error.name !== 'ReferenceNotFoundError' &&
				error.name !== 'TransactionNotConfirmedError'
			) {
				console.error('[SuperPay] Poll error:', error);
			}
			if (statusElement && !paymentComplete) {
				statusElement.textContent = 'Waiting for payment...';
			}
		}
	}, 3000);

	setTimeout(() => {
		if (!paymentComplete) {
			clearInterval(interval);
			if (statusElement) {
				statusElement.textContent = 'Payment window expired. Try again.';
				statusElement.classList.remove('animate-pulse');
				statusElement.classList.add('text-orange-500');
			}
		}
	}, 5 * 60 * 1000);
}

// Toast notification function with fixed animation
function showToast(
	message: string,
	type: 'error' | 'success' | 'info' = 'error'
) {
	// Remove existing toast if any
	const existingToast = document.getElementById('superpage-toast');
	if (existingToast) existingToast.remove();

	const toast = document.createElement('div');
	toast.id = 'superpage-toast';

	// Set color based on type
	let icon = `<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>`;

	if (type === 'success') {
		icon = `<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>`;
	} else if (type === 'info') {
		icon = `<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z" clip-rule="evenodd"></path></svg>`;
	}

	// Use direct style setting instead of classes for the animation
	toast.style.position = 'fixed';
	toast.style.bottom = '16px';
	toast.style.right = '16px';
	toast.style.zIndex = '10000';
	toast.style.display = 'flex';
	toast.style.alignItems = 'center';
	toast.style.padding = '0.75rem 1rem';
	toast.style.borderRadius = '0.5rem';
	toast.style.color = 'white';
	toast.style.boxShadow =
		'0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
	toast.style.opacity = '0';
	toast.style.transform = 'translateY(20px)';

	// Set color based on type
	toast.style.backgroundColor =
		type === 'success' ? '#10B981' : type === 'info' ? '#3B82F6' : '#EF4444';

	toast.innerHTML = `
        ${icon}
        <span>${message}</span>
    `;

	document.body.appendChild(toast);

	// Force reflow to ensure the initial CSS state is applied
	void toast.offsetWidth;

	// Start the animation after a tiny delay
	setTimeout(() => {
		toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
		toast.style.opacity = '1';
		toast.style.transform = 'translateY(0)';
	}, 10);

	// Remove toast after 3 seconds with animation
	setTimeout(() => {
		toast.style.opacity = '0';
		toast.style.transform = 'translateY(20px)';

		// Remove the element after the animation completes
		setTimeout(() => toast.remove(), 300);
	}, 3000);
}
