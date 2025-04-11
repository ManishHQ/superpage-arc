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
		}, 1000);

		setTimeout(() => {
			clearInterval(interval);
			resolve(null);
		}, timeout);
	});
};

const injectTipButton = async () => {
	await injectTailwindCSS();
	const ownerSection = await waitForElement('#owner');
	if (!ownerSection) return;

	if (document.getElementById('superpage-tip-btn')) return;

	const button = document.createElement('button');
	button.id = 'superpage-tip-btn';
	button.textContent = '💸 Tip';
	button.className =
		'bg-blue-500 text-white px-5 py-2 rounded-md text-base ml-2 mt-2 hover:bg-blue-600 transition-all font-medium';

	button.onclick = () => {
		const channelName =
			document.querySelector('#text > a')?.textContent || 'this creator';
		createPopup(channelName);
	};

	ownerSection.appendChild(button);
};

injectTipButton();
