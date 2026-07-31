import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import ts from 'typescript-eslint';

export default ts.config(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				// Zur Bauzeit von vite.config.ts eingesetzt.
				__APP_VERSION__: 'readonly',
				__BUILD_TIME__: 'readonly'
			}
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: { parser: ts.parser }
		}
	},
	{
		ignores: [
			'build/',
			'.svelte-kit/',
			'dist/',
			'node_modules/',
			'src/lib/gql/__generated__/',
			'schema.graphql',
			// Testausgaben, nicht Quellcode.
			'coverage/',
			'playwright-report/',
			'test-results/'
		]
	}
);
