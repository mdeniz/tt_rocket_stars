const { defineConfig, devices } = require('@playwright/test');

const fullBrowserMatrix = process.env.PLAYWRIGHT_FULL === '1' || Boolean(process.env.CI);
const muteAudio = { args: ['--mute-audio'] };
const mutedAudioState = {
  origins: [
    {
      origin: 'http://127.0.0.1:4173',
      localStorage: [
        {
          name: 'tt-rocket-sound-v112',
          value: JSON.stringify({ enabled: false, music: 25, sfx: 65, ambient: 40, track: 'all', shuffle: false }),
        },
      ],
    },
  ],
};
const projects = [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'], launchOptions: muteAudio },
  },
];

if (fullBrowserMatrix) {
  projects.push(
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          args: ['--mute-audio'],
          firefoxUserPrefs: { 'media.volume_scale': '0.0' },
        },
      },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  );
}

if (process.env.PLAYWRIGHT_MOBILE === '1') {
  projects.push({
    name: 'webkit-mobile',
    use: {
      browserName: 'webkit',
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    },
  });
}

module.exports = defineConfig({
  testDir: 'tests/e2e',
  timeout: 45000,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.PLAYWRIGHT_WORKERS ? Number(process.env.PLAYWRIGHT_WORKERS) : 2,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    storageState: mutedAudioState,
  },
  projects,
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
