import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'src/**/*.test.{ts,tsx}',
      'tests/config/**/*.test.ts',
      'tests/performance/**/*.test.ts',
    ],
  },
});
