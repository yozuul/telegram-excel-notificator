import path from 'path'
import { access, rm } from 'fs/promises'
import fetch from 'node-fetch'
import axios from 'axios'
import puppeteer from 'puppeteer'
import xlsx from 'node-xlsx'

import { SettingsController } from '../controllers'

const date = new Date()
const cD = {
   year: date.getFullYear(),
   month: date.getMonth(),
   day: date.getDate()
}
const importPath = path.resolve('./.imports')

export class ExcelParser {
   prepareMessage(update) {
      let data = { update: false }
      let message = []
      for (let checkedCompany in update) {
         const companyTable = update[checkedCompany]
         if(companyTable.data.length > 0) {
            const company = {
               name: `${checkedCompany}`,
               data: '', total: 0
            }
            for (let data of companyTable.data) {
               const customer = {
                  name: data[1], summ: data[2], rp: data[4]
               }
               company.data += `${customer.name} - ${this.formatCurrency(customer.summ)}`
               if(customer.rp) {
                  company.data += ` - ${customer.rp}\n`
               } else {
                  company.data += `\n`
               }
               company.total += customer.summ
            }
            company.total = this.formatCurrency(company.total)
            message.push(company)
            data.update = companyTable.date
         }
      }
      if(message.length === 0) {
         message =  `${cD.day - 1}.${cD.month + 1}.${cD.year}`
      }

      console.log(message)
      axios.post('http://localhost:3000/sendNotify', {...data, text: message})
   }

   formatCurrency(summ) {
      const formatter = new Intl.NumberFormat('ru-RU', {
         style: 'currency',
         currency: 'RUR',
      })
      return formatter.format(summ)
   }

   async checkUpdate() {
      const settings = await SettingsController.getSettings()
      const filePath = `${importPath}/${settings.file_name}`
      await this.importsClean(filePath)
      const browser = await this.downloadFile(settings.file_url)
      await this.waitDownload(filePath)
      await browser.close()
      const table = await xlsx.parse(filePath)
      let update = {}
      for (let company of table) {
         const isUpdate = this.checkDate(company.data)
         update[company.name] = isUpdate
      }
      this.prepareMessage(update)
   }

   checkDate(rows) {
      let update = { date: false, data: [] }
      for (let row of rows) {
         if((row.length > 0) && (typeof row[0] === 'number')) {
            const date = this.convertDate(row[0])
            update.date = date
            if(date) update.data.push(row)
         }
      }
      return update
   }

   convertDate(utcDate) {
      const utcValue = Math.floor(utcDate - 25569) * 86400
      const tableDate = new Date(utcValue * 1000)
      const eD = {
         year: tableDate.getFullYear(),
         month: tableDate.getMonth(),
         day: tableDate.getDate()
      }
      if((eD.year === cD.year) && (eD.month === cD.month) && (eD.day + 1 === cD.day)) {
         return `${eD.day}.${eD.month + 1}.${eD.year}`
      }
   }

   async importsClean(filePath) {
      try {
         await access(filePath)
         await rm(filePath)
       } catch {
         console.log('Файла нет')
       }
   }

   async waitDownload(filePath) {
      const checkFileExist = async () => {
         try {
            await access(filePath)
            return true
          } catch {
            return false
          }
      }
      let fileExist = false
      while(!fileExist) {
         fileExist = await checkFileExist()
      }
   }

   async downloadFile(url) {
      const browser = await puppeteer.launch({
         // headless: true,
         // args: ['--window-size=1920,1020']
      })
      try {
         const page = await browser.newPage();
         await page._client.send("Page.setDownloadBehavior", {
            behavior: 'allow',
            downloadPath: importPath
          })
         await page.goto(url, { waitUntil: 'networkidle2' })
      } catch (error) {
         return browser
      }
   }

   async testNewUrl(url) {
      const urlToCheck = `${url}&download=1`
      try {
         const checkPath = await fetch(urlToCheck)
         const decodedUrl = decodeURI(checkPath.url)
         if(!decodedUrl.split('.xls')[1]) {
            return '❌ По указанному URL таблиц не найдено'
         } else {
            const fileName = decodedUrl.split('/').pop()
            await SettingsController.updateFileUrl(urlToCheck, fileName)
            return `✅\n<pre>Путь к файлу</pre>${fileName}<pre>успешно обновлён</pre>`
         }
      } catch (error) {
         return '❌ Указан неправильный URL'
      }
   }
}
