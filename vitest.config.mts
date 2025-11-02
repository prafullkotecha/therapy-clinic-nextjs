import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'text-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.stories.{js,jsx,ts,tsx}',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/*.d.ts',
        'src/**/*.config.{ts,tsx}',
        'src/app/**/*',
        'src/types/**/*',
        'src/**/index.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.{js,ts}'],
          exclude: [
            'src/hooks/**/*.test.ts',
            'src/lib/__tests__/tenant-isolation.test.ts',
          ],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          name: 'ui',
          include: ['**/*.test.tsx', 'src/hooks/**/*.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            screenshotDirectory: 'vitest-test-results',
            instances: [
              { browser: 'chromium' },
            ],
          },
        },
      },
    ],
    env: loadEnv('', process.cwd(), ''),
  },
});
