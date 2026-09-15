import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/browser',
  use: { ...devices['Pixel 7'], browserName: 'chromium' },
  reporter: 'list',
});
