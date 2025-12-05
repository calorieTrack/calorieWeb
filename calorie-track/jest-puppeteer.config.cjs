const isCI = process.env.CI === 'true';

module.exports = {
  launch: {
    headless: true,
    slowMo: 50,
    args: isCI ? [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ] : [],
  },
  
  server: {
    command: 'npm start', 
    port: 5173,
    host: '127.0.0.1',           
    launchTimeout: 30000, 
    debug: true,
    usedPortAction: 'ignore',          
  },
}