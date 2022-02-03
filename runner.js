import { readFileSync } from 'fs'
import pm2 from'pm2'

const cronTimer = readFileSync('./config/cron-restart.config', 'utf8')

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
		cron_restart: cronTimer,
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

export { appData }