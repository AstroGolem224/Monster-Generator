import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['test/unit/**/*.test.js'],
    exclude: [
      'node_modules/',
      '.claude/',
      'src/legacy/'
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.claude/',
        'src/legacy/',
        'test/',
        '**/*.config.js'
      ]
    },
    setupFiles: ['./test/setup.js']
  }
});
