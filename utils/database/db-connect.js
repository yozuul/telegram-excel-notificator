import { Sequelize } from 'sequelize'
import DataTypes from 'sequelize'

import { darkGray, red } from 'ansicolor'
// Конфигурация подключения
import { pg_config } from '../../config'
// Postgres
export const postgres = new Sequelize(
    pg_config.database,
    pg_config.user,
    pg_config.password, {
    host: pg_config.host,
    port: pg_config.port,
    dialect: 'postgres',
    logging: false
  }
)
// Подключение postgres
try {
    await postgres.authenticate();
    console.log(('\nПодключение к Postgres установлено').darkGray);
} catch (err) {
    console.log(err)
    console.error(('Ошибка подключения Postgres').red);
}

export const Op = Sequelize.Op
export { DataTypes }