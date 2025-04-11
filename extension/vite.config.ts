import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	build: {
		outDir: 'dist',
		rollupOptions: {
			input: {
				popup: path.resolve(__dirname, 'public/popup.html'),
				content: path.resolve(__dirname, 'src/content/content.ts'),
				'phantom-bridge': path.resolve(
					__dirname,
					'src/injected/phantom-bridge.ts'
				),
			},
			output: {
				entryFileNames: '[name].js', // 👈 Ensures content.js and popup.js
			},
		},
	},
});
