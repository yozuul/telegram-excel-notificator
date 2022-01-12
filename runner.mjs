import pm2 from'pm2'

const appData = [
   {
      cwd: './',
      name: 'telegram-bot',
      script: 'server.js',
      node_args: '-r dotenv/config --es-module-specifier-resolution=node',
   },
   {
      name: 'excel-parser',
      script: 'check-update.js',
      node_args: '-r dotenv/config --es-module-specifier-resolution=node',
      // cron_restart: '30 12 * * 1-5',
      cron_restart: '*/1 * * * *',
   }
]
pm2.connect((err) => {
   if (err) {
     console.error(err)
     process.exit(2)
   }
   pm2.start(appData, (err, apps) => {
     if (err) {
       console.error(err)
       return pm2.disconnect()
     }
     pm2.disconnect()
   })
 })