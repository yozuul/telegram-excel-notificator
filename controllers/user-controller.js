import { UserService } from '../services'

export class UserController {
    static async getAllUsers() {
        try {
            return UserService.getAllUsers()
        } catch (err) {
            console.log(err)
        }
    }
    static async getAuthUsers() {
        try {
            return UserService.getAuthUsers()
        } catch (err) {
            console.log(err)
        }
    }
    static async findByTgId(tg_id) {
        try {
            return UserService.findByTgId(tg_id)
        } catch (err) {
            console.log(err)
        }
    }
    static async findByPhone(phone_num) {
        try {
            return UserService.findByPhone(phone_num)
        } catch (err) {
            console.log(err)
        }
    }
    static async saveNewPhone(phone_num) {
        try {
            return UserService.saveNewPhone(phone_num)
        } catch (err) {
            console.log(err)
        }
    }
    static async confirmPhone(phone_num) {
        try {
            return UserService.confirmPhone(phone_num)
        } catch (err) {
            console.log(err)
        }
    }
    static async deletePhone(phone_num) {
        try {
            return UserService.deletePhone(phone_num)
        } catch (err) {
            console.log(err)
        }
    }
}
