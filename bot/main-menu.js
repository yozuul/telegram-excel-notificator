import { UserController, SettingsController } from '../controllers'
import { ExcelParser } from '../utils/excel-parser'

export class MainMenu {
   constructor(bot) {
      this.bot = bot
      this.user = {}
   }
   async sendNotify(data, message) {
      const authUsers = await UserController.getAuthUsers()
      if(!data.update) {
         message = `Поступлений ${data.text} не было ☹`
      } else {
         message = `Поступления за ${data.update}\n`
         let count = 1
         for (let text of data.text) {
            message += `<pre>${text.name}:</pre>\n${text.data}Итого, ${text.name}: ${text.total}`
            if(data.text.length !== count) message += '\n-\n'
            count++
         }
      }
      for (let user of authUsers) {
         try {
            await this.bot.sendMessage(user.tg_id, message, { parse_mode: 'HTML' })
         } catch (error) {
            console.log(error)
         }
      }
   }

   async addNewPhone(chat_id) {
      await this.checkInit(chat_id)
      const title = 'Для удаления привязанного телефона, нажмите на соотвествующую кнопку с его номером.\nДля добавления нового, отправьте его номер в чат в формате: \n+7xxxxxxxxxx'
      const users = await UserController.getAllUsers()
      this.existPhonesKeyboard(users)
      await this.bot.sendMessage(chat_id, title, {
         reply_markup: JSON.stringify({
            inline_keyboard: this.existPhonesKeyboard(users)
         })
      })
      this.user[chat_id].currentPath = 'addNewPhone'
   }

   async deletePhone(chat_id, phone_num, message_id) {
      await UserController.deletePhone(phone_num)
      const users = await UserController.getAllUsers()
      this.bot.editMessageText(`Пользователь с номером ${phone_num} успешно удалён`, {
         chat_id: chat_id,
         message_id: message_id,
         reply_markup: JSON.stringify({
            inline_keyboard: this.existPhonesKeyboard(users)
         })
      })
   }

   async checkAddNewPhone(chat_id, phoneNumber) {
      await this.checkInit(chat_id)
      const checkCorrectPhone = parseInt(phoneNumber)
      if(this.user[chat_id].currentPath === 'addNewPhone') {
         if(checkCorrectPhone.toString().length === 11) {
            const user = await UserController.saveNewPhone(phoneNumber)
            await this.bot.sendMessage(chat_id, user.text)
         } else {
            await this.bot.sendMessage(chat_id, 'Номер указан не верно')
            return
         }
      }
   }
   async checkNewUrl(chat_id, urlPath) {
      await this.checkInit(chat_id)
      if(this.user[chat_id].currentPath === 'changeTableUrl') {
         const checked = await new ExcelParser().testNewUrl(urlPath)
         await this.bot.sendMessage(chat_id, checked, { parse_mode: 'HTML' })
      }
   }

   async changeTableUrl(chat_id) {
      const settings = await SettingsController.getSettings()
      console.log(settings.file_name)
      const title = `<pre>Текущий URL ссылается на файл:</pre>${settings.file_name}<pre>Для изменения текущего файла, отправьте новый URL в чат:</pre>`
      const msg = await this.bot.sendMessage(chat_id, title, { parse_mode: 'HTML' })
      await this.checkInit(chat_id)
      this.user[chat_id].currentPath = 'changeTableUrl'
   }
   async adminMenu(chat_id) {
      if(!this.user[chat_id]) {
         this.initNavigation(chat_id)
         await this.startedAdminKeyboard(chat_id)
      }
   }
   async forceStarted(chat_id) {
      this.initNavigation(chat_id)
      await this.startedAdminKeyboard(chat_id)
   }
   async unAuthorizedUser(chat_id) {
      await this.bot.sendMessage(chat_id, 'Для доступа к боту, нажмите на кнопку ниже:', {
         reply_markup: {
            keyboard: [[{
               text: '📞 Авторизация по номеру телефона',
               request_contact: true
            }]]
         }
      })
   }
   async userNotExist(chat_id) {
      await this.bot.sendMessage(chat_id, '⛔️')
      await this.bot.sendMessage(chat_id, 'Вы не имеете доступа к боту')
   }

   async authorizedUser(chat_id) {
      const message = await this.bot.sendMessage(chat_id, 'Вы успешно авторизованы', {
         reply_markup: {
            keyboard: [[{
               text: 'Авторизованный пользователь',
               resize_keyboard: true
            }]]
         }
      })
      await this.bot.deleteMessage(chat_id, message.message_id)
      await this.bot.sendMessage(chat_id, '✅')
      await this.bot.sendMessage(chat_id, 'Вы успешно авторизованы!')
   }

   async startedAdminKeyboard(chat_id) {
      this.bot.sendMessage(chat_id, '<pre>ВЫ ВОШЛИ КАК АДМИНИСТРАТОР</pre>', {
         reply_markup: {
            keyboard: [['🔗 Изменить URL файла', '📞 Добавить номер']],
            resize_keyboard: true
         },
         parse_mode: 'HTML'
      })
   }

   existPhonesKeyboard(users) {
      const phonesKeyboard = []
      let keyboardRow = []
      for(let user of users) {
         keyboardRow.push({
            text: `${user.phone_num} ❌`,
            callback_data: user.phone_num,
         })
         if(keyboardRow.length === 2) {
            phonesKeyboard.push(keyboardRow)
            keyboardRow = []
         }
      }
      keyboardRow.length > 0 ? phonesKeyboard.push(keyboardRow) : ''
      return phonesKeyboard
   }
   async checkInit(chat_id) {
      if(!this.user[chat_id]) this.initNavigation(chat_id)
   }
   async initNavigation(chat_id) {
      this.user[chat_id] = { currentPath: '/' }
   }
}