import path from 'path'
import { access, rm } from 'fs/promises'
import fetch from 'node-fetch'
import axios from 'axios'
import puppeteer from 'puppeteer'
import xlsx from 'node-xlsx'

import { SettingsController } from '../controllers'

const date = new Date()
let cD = {
   year: date.getFullYear(),
   month: date.getMonth(),
   day: date.getDate()
}
let checkPrevMonth = false
const prevMonthDay = new Date(date.getFullYear(), date.getMonth(), 0).getDate()
if(cD.day === 1) checkPrevMonth = true
let hasNewDatCipher = {}

const importPath = path.resolve('./.imports')

export class ExcelParser {
   prepareMessage(update) {
      let data = { update: false }
      let allMessage = []
      let sortByName = {}
      for (let checkedCompany in update) {
         const companyTable = update[checkedCompany]
         if(companyTable.data.length > 0) {
            const company = {
               name: `${checkedCompany}`,
               data: '', total: 0
            }
            for (let data of companyTable.data) {
               const customer = {
                  summ: data[1], cipher: data[4], name: data[6], rp: data[7], type: data[8],
                  company: checkedCompany,
               }
               if((data[4] === 'оплата') || data[4] === 'Оплата') {
                  hasNewDatCipher[checkedCompany] = true
                  if(!(customer.rp in sortByName)) sortByName[customer.rp] = []
                  if(customer.rp in sortByName) sortByName[customer.rp].push(customer)
                  company.data += `${customer.name} - <i>${this.formatCurrency(customer.summ)}</i>`
                  if(customer.rp) {
                     let rpField = customer.rp
                     if(customer.type !== 'Консалтинг') rpField = customer.type
                     company.data += ` - ${rpField}\n\n`
                  } else {
                     company.data += `\n`
                  }
                  company.total += customer.summ
               }
            }
            if(hasNewDatCipher[checkedCompany]) {
               company.total = this.formatCurrency(company.total)
               allMessage.push(company)
               data.update = companyTable.date
            }
         }
      }
      let currentDate = `${cD.day - 1}.${cD.month + 1}.${cD.year}`
      if(checkPrevMonth) currentDate = `${prevMonthDay}.${cD.month}.${cD.year}`
      if(allMessage.length === 0) {
         allMessage =  currentDate
         axios.post('http://localhost:3000/sendNotifyNoUpdate', {...data, text: allMessage})
         return
      }

      axios.post('http://localhost:3000/sendNotifyAdmins', {update: currentDate, text: allMessage})
      const messageByUser = {}
      for (let user in sortByName) {
         messageByUser[user] = []
         let userData = this.prepareByName(sortByName[user])
         messageByUser[user].push(userData)
      }
      axios.post('http://localhost:3000/sendNotifyByUser', {currentDate: currentDate, text: messageByUser})
   }

   prepareByName(userData) {
      let allMessage = {}
      const msgData = []
      for (let customer of userData) {
         if(!(customer.company in allMessage)) {
            allMessage[customer.company] = {
               data: '', total: 0
            }
         }
         let rpField = customer.rp
         if(customer.type !== 'Консалтинг') rpField = customer.type
         allMessage[customer.company].data += `${customer.name} - <i>${this.formatCurrency(customer.summ)}</i> - ${rpField}\n\n`
         allMessage[customer.company].total += customer.summ
      }
      for (let company in allMessage) {
         const data = allMessage[company]
         msgData.push({
            name: company,
            data: data.data,
            total: this.formatCurrency(data.total)
         })
      }
      return msgData
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
      if(checkPrevMonth) {
         if((eD.year === cD.year) && (eD.month === cD.month - 1) && (prevMonthDay === eD.day)) {
            return `${eD.day}.${eD.month}.${eD.year}`
         } else {
            return false
         }
      }
      if((eD.year === cD.year) && (eD.month === cD.month) && (eD.day + 1 === cD.day)) {
         return `${eD.day}.${eD.month + 1}.${eD.year}`
      } else {
         return false
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
         args: ['--no-sandbox'],
         // headless: false,
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
            console.log(fileName)
            await SettingsController.updateFileUrl(urlToCheck, fileName)
            return `✅\n<pre>Путь к файлу</pre>${fileName}<pre>успешно обновлён</pre>`
         }
      } catch (error) {
         return '❌ Указан неправильный URL'
      }
   }
}