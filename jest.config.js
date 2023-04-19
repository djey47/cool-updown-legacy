/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  setupFiles: [
    // '<rootDir>/config/jest/globalMocks.ts',
  ],
  testEnvironment: 'node',
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
};
