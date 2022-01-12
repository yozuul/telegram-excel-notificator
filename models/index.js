import pgSync from '../utils/database/db-sync'

import UserModel from './user-model'
import SettingsModel from './settings-model'

pgSync({
   UserModel: UserModel,
   SettingsModel: SettingsModel,
})

export { UserModel, SettingsModel }