import { SettingsService } from '../services'

export class SettingsController {
    static async getSettings() {
        try {
            return SettingsService.getSettings()
        } catch (err) {
            console.log(err)
        }
    }
    static async updateFileUrl(url, fileName) {
        try {
            return SettingsService.updateFileUrl(url, fileName)
        } catch (err) {
            console.log(err)
        }
    }
}
