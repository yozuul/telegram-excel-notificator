import { postgres, DataTypes } from '../utils'

const { STRING, INTEGER, BIGINT } = DataTypes

export default postgres.define('users', {
    name: {
        type: STRING,
        allowNull: true,
        defaultValue: null
    },
    role_id: {
        type: INTEGER
    },
    tg_id: {
        type: BIGINT
    },
    phone_num: {
        type: STRING
    }
}, {
    tableName: 'users',
    timestamps: false
})
