import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // The entry file exports nothing and is never hot-reloaded, so this rule doesn't apply to it.
    files: ['src/main.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // Client screens, shared code and tests never reach Supabase directly (CLAUDE.md, ADR-037, ADR-043).
    files: ['src/client/**', 'src/shared/**', 'src/tests/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@supabase/*'],
            message: 'Only dashboard code talks to Supabase (ADR-043). Client screens use the Edge Functions.',
          },
          {
            group: ['**/dashboard', '**/dashboard/**'],
            message: 'Client screens, shared code and tests must not import dashboard code.',
          },
        ],
      }],
    },
  },
  {
    // The one exception: the client's tab listens on its visit's channel with the real-time library alone,
    // never the Supabase client (ADR-051). Same rule as above, with only that package let through.
    files: ['src/client/listen-for-checks.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@supabase/*', '!@supabase/realtime-js'],
            message: 'Only dashboard code talks to Supabase (ADR-043). This file may use the real-time library alone (ADR-051).',
          },
          {
            group: ['**/dashboard', '**/dashboard/**'],
            message: 'Client screens, shared code and tests must not import dashboard code.',
          },
        ],
      }],
    },
  },
])
