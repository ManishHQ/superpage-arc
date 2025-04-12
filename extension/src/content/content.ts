import { createPopup } from '@/components/PaymentModal';

function injectTailwindCSS(): Promise<void> {
	return new Promise((resolve) => {
		const id = 'superpage-tailwind-css';
		if (document.getElementById(id)) return resolve();

		const link = document.createElement('link');
		link.id = id;
		link.href =
			'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
		link.rel = 'stylesheet';
		link.onload = () => resolve();
		document.head.appendChild(link);
	});
}

function injectCustomStyles(): void {
	const id = 'superpage-custom-styles';
	if (document.getElementById(id)) return;

	const style = document.createElement('style');
	style.id = id;
	style.textContent = `
        .superpage-btn {
            background: linear-gradient(to right, #8b5cf6, #6366f1);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 500;
            font-size: 14px;
            display: inline-flex;
            align-items: center;
            transition: all 0.2s ease;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            border: none;
            cursor: pointer;
            margin-left: 8px;
            position: relative;
            overflow: hidden;
        }
        
        .superpage-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            background: linear-gradient(to right, #7c3aed, #4f46e5);
        }
        
        .superpage-btn:active {
            transform: translateY(1px);
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .superpage-btn-icon {
            margin-right: 6px;
            display: inline-block;
        }
        
        .superpage-btn .superpage-tooltip {
            position: absolute;
            background: #1e293b;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            bottom: -30px;
            left: 50%;
            transform: translateX(-50%);
            opacity: 0;
            transition: all 0.2s ease;
            pointer-events: none;
            white-space: nowrap;
        }
        
        .superpage-btn:hover .superpage-tooltip {
            opacity: 1;
            bottom: -25px;
        }
        
        .superpage-logo-pulse {
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(0.95); }
            50% { transform: scale(1.05); }
            100% { transform: scale(0.95); }
        }
    `;
	document.head.appendChild(style);
}

function injectPhantomBridge(): void {
	const id = 'phantom-bridge-script';
	if (document.getElementById(id)) return;

	const script = document.createElement('script');
	script.id = id;
	script.src = chrome.runtime.getURL('phantomBridge.js'); // ✅ matches renamed file
	script.type = 'module';
	(document.head || document.documentElement).appendChild(script);
}

injectPhantomBridge();

const waitForElement = (
	selector: string,
	timeout = 5000
): Promise<Element | null> => {
	return new Promise((resolve) => {
		// Check if element already exists
		const existingElement = document.querySelector(selector);
		if (existingElement) {
			resolve(existingElement);
			return;
		}

		const interval = setInterval(() => {
			const el = document.querySelector(selector);
			if (el) {
				clearInterval(interval);
				resolve(el);
			}
		}, 500); // Check more frequently

		setTimeout(() => {
			clearInterval(interval);
			resolve(null);
		}, timeout);
	});
};

const injectTipButton = async () => {
	await injectTailwindCSS();
	injectCustomStyles();

	const ownerSection = await waitForElement('#owner');
	if (!ownerSection) return;

	if (document.getElementById('superpage-tip-btn')) return;

	const button = document.createElement('button');
	button.id = 'superpage-tip-btn';
	button.className = 'superpage-btn';

	// Better inner content with SVG icon
	button.innerHTML = `
        <span class="superpage-btn-icon">
			💸
        </span>
        Tip
        <span class="superpage-tooltip">Support with Solana</span>
    `;

	button.onclick = (e) => {
		e.stopPropagation(); // Prevent YouTube click events from interfering

		// Visual feedback on click
		button.style.transform = 'scale(0.95)';
		setTimeout(() => {
			button.style.transform = '';
		}, 100);

		// Get channel name more reliably with fallbacks
		const channelName =
			document.querySelector('#text > a')?.textContent ||
			document.querySelector('.ytd-channel-name a')?.textContent ||
			document.querySelector('[itemprop="author"] [itemprop="name"]')
				?.textContent ||
			'this creator';

		createPopup(channelName);
	};

	// Insert button in a better position
	const metaArea = ownerSection.querySelector('#meta') || ownerSection;
	metaArea.appendChild(button);

	// Log for debugging
	console.log('[SuperPay] Tip button injected successfully');
};

// Initial injection
injectTipButton();

// Handle navigation on YouTube's SPA
const observer = new MutationObserver((mutations) => {
	mutations.forEach((mutation) => {
		if (
			mutation.type === 'childList' &&
			document.location.pathname.includes('/watch')
		) {
			// YouTube navigation detected, try to re-inject the button
			setTimeout(injectTipButton, 1000);
		}
	});
});

// Start observing the target node for configured mutations
observer.observe(document.body, { childList: true, subtree: true });
