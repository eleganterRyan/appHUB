import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Todo } from '../entities/Todo';

// 加载环境变量
dotenv.config();

// 创建数据库连接
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '247624',
  database: process.env.POSTGRES_DB || 'apphub',
  synchronize: process.env.NODE_ENV === 'development', // 开发环境下自动同步数据库结构
  logging: process.env.NODE_ENV === 'development',
  entities: [Todo],
  subscribers: [],
  migrations: [],
}); 