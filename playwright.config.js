import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', timeout: 60000, expect: { timeout: 15000 }, workers: 1,
  use: { baseURL: 'http://127.0.0.1:3001', channel: 'msedge', headless: true, reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 }, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3001',
    url: 'http://127.0.0.1:3001', reuseExistingServer: false, timeout: 120000,
    env: { NEXT_PUBLIC_API_URL: 'http://127.0.0.1:5000/api' },
  },
});
