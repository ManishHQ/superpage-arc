import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
	const input =
		mode === 'bridge'
			? path.resolve(__dirname, 'src/injected/phantomBridge.ts')
			: path.resolve(__dirname, 'src/content/content.ts');

	const isBridge = mode === 'bridge';
	const name = isBridge ? 'phantomBridge' : 'content';
	return {
		plugins: [react(), tsconfigPaths()],
		build: {
			alias: {
				'@': path.resolve(__dirname, 'src'),
			},
			lib: {
				entry: input,
				formats: ['iife'],
				name,
				fileName: () => `${isBridge ? 'phantomBridge' : 'content'}.js`,
			},
			outDir: 'dist',
			emptyOutDir: false, // keep popup assets
			rollupOptions: {
				output: {
					entryFileNames: `${name}.js`,
				},
			},
		},
	};
});
