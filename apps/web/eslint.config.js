import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Kept as a warning rather than an error, deliberately. Issue #21 rules
      // the ~140 `any` sites out of scope: the frontend has no test cover, so
      // changing types to satisfy the rule would be a large edit nobody can
      // check (D8). They stay visible in the output, and turning this back up
      // to "error" is the last step of whoever takes that work on.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          // Parameters are not checked. The callbacks here have signatures
          // their libraries chose — antd's `render: (value, record, index)`,
          // redux-toolkit's `(state, action)`, antd Upload's
          // `{ file, onSuccess, onError }` — and a parameter before one that is
          // used cannot be dropped. What is left to report would be noise.
          args: 'none',
          // An unused local or import is still an error: that one is real, and
          // deleting it is safe.
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    // The entry point is the one module Vite never hot-replaces — it mounts the
    // app. "Move your component to another file so fast refresh works" is not
    // advice that applies to it.
    files: ['src/main.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
