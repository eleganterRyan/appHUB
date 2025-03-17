import 'reflect-metadata';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 导入数据库配置
import { AppDataSource } from './config/database';

// 导入路由
import todoRoutes from './routes/todoRoutes';
import weatherRoutes from './routes/weatherRoutes';
import excelRoutes from './routes/excelRoutes';

// 导入中间件
import { logger } from './middleware/logger';

// 加载环境变量
dotenv.config();

const app: Express = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;

// CORS配置 - 允许所有来源
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// 中间件
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// 路由
app.use('/api/todos', todoRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/excel', excelRoutes);

// 根路由
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'AppHUB API 服务器运行中' });
});

// 启动服务器
const startServer = async () => {
  try {
    // 初始化数据库连接
    await AppDataSource.initialize();
    console.log('数据库连接成功');
    
    // 启动服务器
    app.listen(port, '0.0.0.0', () => {
      console.log(`服务器运行在 http://localhost:${port}`);
      console.log(`局域网访问: http://<您的IP地址>:${port}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
  }
};

startServer(); 