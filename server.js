import {} from 'dotenv/config'
import express from 'express'
import { darkGray, red } from 'ansicolor'

import { botStart } from './bot'
import { ExcelParser } from './utils/excel-parser'

const PORT = process.env.API_PORT
const botCommand = await botStart()

const startServer = async () => {
   const app = express()
   try {
      app.use(express.json())
      app.post('/sendNotifyAdmins', (req, res, next) => {
         botCommand.sendNotifyAdmins(req.body)
         res.send('OK')
         next()
      })
      app.post('/sendNotifyByUser', (req, res, next) => {
         botCommand.sendNotifyByUser(req.body)
         res.send('OK')
         next()
      })
      app.post('/sendNotifyNoUpdate', (req, res, next) => {
         botCommand.sendNotifyNoUpdate(req.body)
         res.send('OK')
         next()
      })
      app.listen(PORT, () => {
         console.log((`\nСервер запущен на порту ${PORT}`).darkGray)
      })
   } catch (err) {
      console.log(err)
      console.log(('Ошибка запуска сервера').red);
   }
}

startServer()
new ExcelParser().checkUpdate()