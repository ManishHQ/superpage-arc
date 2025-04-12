import {
	encodeURL,
	createQR,
	findReference,
	validateTransfer,
} from '@solana/pay';

import { PublicKey, Connection, clusterApiUrl, Keypair } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { Buffer } from 'buffer';

// Make sure Buffer is available globally
if (typeof window !== 'undefined') {
	window.Buffer = Buffer;
}

// Solana connection for devnet or mainnet
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

export const createPopup = (channelName: string) => {
	if (document.getElementById('superpage-popup')) return;
	console.log(`[SuperPay] Opening tip modal for ${channelName}`);

	// Create backdrop
	const backdrop = document.createElement('div');
	backdrop.id = 'superpage-backdrop';
	backdrop.className =
		'fixed inset-0 bg-black bg-opacity-50 z-[9998] backdrop-blur-sm';
	document.body.appendChild(backdrop);

	// Create modal
	const popup = document.createElement('div');
	popup.id = 'superpage-popup';
	popup.className =
		'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-xl p-6 z-[9999] w-[360px] shadow-2xl animate-fade-in';

	popup.innerHTML = `
      <style>
        @keyframes fade-in {
          0% { opacity: 0; transform: translate(-50%, -60%) scale(0.95); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .qr-appear {
          animation: qr-appear 0.4s forwards;
        }
        @keyframes qr-appear {
          0% { opacity: 0; max-height: 0; }
          100% { opacity: 1; max-height: 300px; }
        }
      </style>
      
      <!-- Header with logo -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center">
          <div class="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-800 dark:text-white">SuperPay</h3>
        </div>
        <button id="superpage-close" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      
      <!-- Content -->
      <div class="mb-6">
        <p class="text-center mb-4 text-gray-600 dark:text-gray-300">Send a tip to <span class="font-semibold text-purple-600">${channelName}</span></p>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
          <div class="relative rounded-md shadow-sm">
            <input id="superpage-amount" type="number" placeholder="0.05" min="0.001" step="0.001"
              class="w-full pl-3 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white" />
            <div class="absolute inset-y-0 right-0 flex items-center pr-3">
              <span class="text-gray-500 dark:text-gray-400">SOL</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Action buttons -->
      <div class="space-y-3">
        <button id="superpage-use-extension" 
          class="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 rounded-md hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 font-medium flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
            <path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd" />
          </svg>
          Pay with Phantom Extension
        </button>
        
        <button id="superpage-send" 
          class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 font-medium flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 6h1m-7 7v1m-6-6H4" />
          </svg>
          Generate QR Code
        </button>
      </div>
      
      <!-- QR Code container -->
      <div id="qr-code" class="hidden mt-5 justify-center items-center flex-col">
        <div class="p-3 bg-white rounded-lg shadow-md">
          <!-- QR will be inserted here -->
        </div>
        <p class="text-sm text-center text-gray-500 mt-3">Scan with a Solana Pay compatible wallet</p>
      </div>
    `;
	document.body.appendChild(popup);

	// Close button handler
	document.getElementById('superpage-close')?.addEventListener('click', () => {
		document.getElementById('superpage-backdrop')?.remove();
		popup.remove();
	});

	// Close on backdrop click
	document
		.getElementById('superpage-backdrop')
		?.addEventListener('click', () => {
			document.getElementById('superpage-backdrop')?.remove();
			popup.remove();
		});

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
					recipient: 'CmtShTafYxCfpAehyvNacWXwGeG2RL9Nvp7T5Q2DheGj',
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
					'CmtShTafYxCfpAehyvNacWXwGeG2RL9Nvp7T5Q2DheGj'
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
