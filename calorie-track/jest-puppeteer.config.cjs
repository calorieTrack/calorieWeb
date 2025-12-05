const isCI = process.env.CI === 'true';

// Prompt: I keep getting "about:blank" when attempting to load the project onto the puppeteer test environment.
// However, when I run the project normally with "npm run dev", it works fine. How do fix this issue?
// Result:
module.exports = {
  launch: {
    // Run headless in CI environments, otherwise run headed for easier local debugging
    headless: isCI ? true : false,
    slowMo: 50,
    args: isCI ? [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ] : [],
  },
  
  browserContext: 'default', // Reuse same browser instance instead of creating new contexts
  
  server: {
    command: 'npm start', 
    port: 5173,
    host: '127.0.0.1',           
    launchTimeout: 30000, 
    debug: true,
    usedPortAction: 'ignore',          
  },
}
// End of result

