import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // The AI extraction API (server/) keeps the Anthropic key off the browser.
    proxy: { '/api': 'http://localhost:8787' },
  },
  test: {
    environment: 'jsdom',
    // Database tests need Postgres (docker compose up -d) and run via `npm run test:db`.
    include: process.env.TEST_DB
      ? ['server/**/*.db.test.js']
      : ['src/**/*.test.{js,jsx}', 'server/**/*.test.js'],
    exclude: process.env.TEST_DB ? [] : ['server/**/*.db.test.js', 'node_modules/**'],
    fileParallelism: !process.env.TEST_DB,
    coverage: { include: ['src/services/**', 'src/lib/**', 'server/**'], exclude: ['**/*.test.js', 'server/index.js', 'server/db/migrate.js'] },
  },
});
