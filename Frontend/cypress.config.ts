import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: false,
    video: false,
    screenshotsFolder: 'coverage/cypress/screenshots',
  },
  env: {
    API_URL: 'http://localhost:3000',
    TEST_EMAIL: 'test@linker.com',
    TEST_PASSWORD: 'TestPassword123',
  },
});