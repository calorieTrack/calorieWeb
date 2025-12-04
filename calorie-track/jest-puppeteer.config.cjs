module.exports = {
  launch: {
    headless: true,
    slowMo: 50,
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