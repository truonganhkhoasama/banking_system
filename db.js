// db.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import initModels from './models/init-models.js';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: process.env.DB_PORT || 5432,
    logging: false,
  }
);

const models = initModels(sequelize);

export { sequelize, models };
