module.exports = {
  launch: {
    headless: "new",
    slowMo: 50,
  },
  
  server: {
    command: 'npm start', 
    port: 5173,           
    launchTimeout: 30000, 
    debug: true,          
  },
}