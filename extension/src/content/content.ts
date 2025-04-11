const script = document.createElement('script');
script.src = chrome.runtime.getURL('phantom-bridge.js');
script.type = 'module';
(document.head || document.documentElement).appendChild(script);

const waitForElement = (
	selector: string,
	timeout = 5000
): Promise<Element | null> => {
	return new Promise((resolve) => {
		const interval = setInterval(() => {
			const el = document.querySelector(selector);
			if (el) {
				clearInterval(interval);
				resolve(el);
			}
		}, 300);

		setTimeout(() => {
			clearInterval(interval);
			resolve(null);
		}, timeout);
	});
};

const injectTipButton = async () => {
	const ownerSection = await waitForElement('#owner');
	if (!ownerSection) return;

	if (document.getElementById('superpage-tip-btn')) return;

	const button = document.createElement('button');
	button.id = 'superpage-tip-btn';
	button.innerText = '💸 Tip';
	button.style.cssText = `
      background-color: #8e44ad;
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      margin-left: 8px;
      margin-top: 10px;
      cursor: pointer;
      border: none;
    `;

	button.onclick = () => {
		const channelName =
			document.querySelector('#text > a')?.textContent || 'this creator';
		createPopup(channelName);
	};

	// Append the tip button to the owner section (after subscribe button)
	ownerSection.appendChild(button);
};

injectTipButton();

const createPopup = (channelName: string) => {
	if (document.getElementById('superpage-popup')) return;

	const popup = document.createElement('div');
	popup.id = 'superpage-popup';
	popup.innerHTML = `
	  <div style="
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: white;
		border: 2px solid #8e44ad;
		border-radius: 12px;
		padding: 20px;
		z-index: 9999;
		width: 300px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
	  ">
		<h3 style="font-size: 16px; margin-bottom: 10px;">Tip ${channelName}</h3>
		<input
		  id="superpage-amount"
		  type="number"
		  placeholder="Amount in SOL"
		  min="0.001"
		  step="0.001"
		  style="width: 100%; padding: 8px; margin-bottom: 12px; border-radius: 6px; border: 1px solid #ccc;"
		/>
		<div style="display: flex; justify-content: flex-end; gap: 10px;">
		  <button id="superpage-cancel" style="background: #ccc; padding: 6px 12px; border-radius: 6px;">Cancel</button>
		  <button id="superpage-send" style="background: #8e44ad; color: white; padding: 6px 12px; border-radius: 6px;">Send Tip</button>
		</div>
	  </div>
	`;
	document.body.appendChild(popup);

	// Button actions
	document.getElementById('superpage-cancel')?.addEventListener('click', () => {
		popup.remove();
	});

	document.getElementById('superpage-send')?.addEventListener('click', () => {
		const amountStr = (
			document.getElementById('superpage-amount') as HTMLInputElement
		).value;
		const amount = parseFloat(amountStr);
		if (!amount || amount < 0.001) {
			alert('Enter a valid amount (min 0.001 SOL)');
			return;
		}

		console.log('[SuperPay] Sending postMessage');

		// For now: send fixed wallet
		window.postMessage(
			{
				type: 'SUPERPAGE_TIP',
				recipient: 'CmtShTafYxCfpAehyvNacWXwGeG2RL9Nvp7T5Q2DheGj', // 🪙 update this
				lamports: amount * 1_000_000_000,
			},
			'*'
		);

		popup.remove();
	});
};
