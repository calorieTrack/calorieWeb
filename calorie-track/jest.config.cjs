// Prompt: I keep getting "about:blank" when attempting to load the project onto the puppeteer test environment.
// However, when I run the project normally with "npm run dev", it works fine. How do fix this issue?
// Result:
 module.exports = {
  verbose: true,
  projects: [
    {
      displayName: "unit",
      testEnvironment: "jsdom",
      moduleNameMapper: {
        "\\.(css|less|scss|sass)$": "identity-obj-proxy",
        "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/__mocks__/fileMock.js"
      },
      testMatch: ["<rootDir>/src/components/__tests__/*.test.jsx"], // Standard Unit tests
      setupFilesAfterEnv: ["<rootDir>/jest.setup.unit.js"],
    },
    {
      displayName: "e2e",
      preset: "jest-puppeteer",
      testMatch: ["<rootDir>/src/e2e/*.e2e.test.jsx"], // Puppeteer tests
    }
  ]
};
// End of result

