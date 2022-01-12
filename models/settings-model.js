import { postgres, DataTypes } from '../utils'

const { STRING } = DataTypes

export default postgres.define('settings', {
    file_url: {
        type: STRING
    },
    file_name: {
        type: STRING
    },
}, {
    tableName: 'settings',
    timestamps: false
})