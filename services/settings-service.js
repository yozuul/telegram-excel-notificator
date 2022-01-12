import { SettingsModel } from '../models'

export class SettingsService {
   static async getSettings() {
      const settings = await SettingsModel.findOne({
         where: { id: 1 }
      })
      return settings
   }
   static async updateFileUrl(url, fileName) {
      const settings = await SettingsService.getSettings()
      settings.file_url = url
      settings.file_name = fileName
      settings.save()
      return settings
   }
}



