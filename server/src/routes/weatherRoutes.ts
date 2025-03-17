import express from 'express';
import { getWeather } from '../controllers/weatherController';

const router = express.Router();

// 获取天气数据
router.get('/', getWeather);

export default router; 