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
      testMatch: ["<rootDir>/src/components/__tests__/*.test.jsx"] // Standard Unit tests
    },
    {
      displayName: "e2e",
      preset: "jest-puppeteer",
      testMatch: ["<rootDir>/src/e2e/*.e2e.test.jsx"], // Puppeteer tests
    }
  ]
};