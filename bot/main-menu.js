import { UserController, SettingsController } from '../controllers'
import { ExcelParser } from '../utils/excel-parser'

export class MainMenu {
   constructor(bot) {
      this.bot = bot
      this.user = {}
   }
   async sendNotifyNoUpdate(data, message) {
      const authUsers = await UserController.getAuthUsers()
      console.log(authUsers)
      message = `Поступлений ${data.text} не было ☹`
      for (let user of authUsers) {
         try {
            await this.bot.sendMessage(user.tg_id, message, { parse_mode: 'HTML' })
         } catch (error) {
            console.log(error)
         }
      }
   }
   async sendNotifyAdmins(data) {
      const adminsUsers = await UserController.getAdmins()
      let message = `Поступления за ${data.update}\n\n`
      let count = 1
      for (let text of data.text) {
         message += `<b>${text.name}:</b>\n${text.data}Итого, <b>${text.name}: ${text.total}</b>`
         if(data.text.length !== count) message += '\n-\n'
         count++
      }
      for (let user of adminsUsers) {
         try {
            await this.bot.sendMessage(user.tg_id, message, { parse_mode: 'HTML' })
         } catch (error) {
            console.log(error)
         }
      }
   }

   async sendNotifyByUser(data) {
      const authUsers = await UserController.getAuthRPusers()
      const noUpdateText = `Поступлений ${data.currentDate} не было ☹`
      for (let user of authUsers) {
         try {
            if(user.name in data.text) {
               let message = `Поступления за ${data.currentDate}\n\n`
               let count = 1
               for (let text of data.text[user.name][0]) {
                  message += `<b>${text.name}:</b>\n${text.data}Итого, <b>${text.name}: ${text.total}</b>`
                  if(data.text.length !== count) message += '\n-\n'
                  count++
               }
               await this.bot.sendMessage(user.tg_id, message, { parse_mode: 'HTML' })
            } else {
               await this.bot.sendMessage(user.tg_id, noUpdateText, { parse_mode: 'HTML' })
            }
         } catch (error) {
            console.log(error)
         }
      }
   }

   async addNewPhone(chat_id) {
      await this.checkInit(chat_id)
      const title = 'Для удаления привязанного телефона, нажмите на соотвествующую кнопку с его номером.\nДля добавления нового, отправьте его номер в чат в формате: \n+7xxxxxxxxxx/Группа/Фамилия Имя'
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

   // const user = await UserController.saveNewPhone(phoneNumber)
   // await this.bot.sendMessage(chat_id, user.text)

   async checkAddNewPhone(chat_id, userData) {
      await this.checkInit(chat_id)
      if(this.user[chat_id].currentPath === 'addNewPhone') {
         const checkCorrectData = userData.split('/')
         const user = {
            phone: checkCorrectData[0],
            group: checkCorrectData[1],
            name: checkCorrectData[2],
         }
         const checkCorrectPhone = parseInt(user.phone)
         console.log(checkCorrectPhone)
         if(checkCorrectPhone.toString().length !== 11) {
            await this.bot.sendMessage(chat_id, 'Номер указан не верно')
            return
         }
         if(!user.group) {
            await this.bot.sendMessage(chat_id, 'Укажите группу')
            return
         }
         if(!user.name) {
            await this.bot.sendMessage(chat_id, 'Укажите Фамилию Имя')
            return
         }
         console.log(user)
         const saveData = await UserController.saveNewPhone(user)
         await this.bot.sendMessage(chat_id, saveData.text)
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
         const userGroup = user.role_id === 2 ? 'Директор' : 'РП'
         const btnText = `${user.phone_num}/${userGroup}/${user.name}`
         keyboardRow.push({
            text: `${user.phone_num} / ${userGroup} / ${user.name} ❌`,
            callback_data: btnText,
         })
         if(keyboardRow.length === 1) {
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