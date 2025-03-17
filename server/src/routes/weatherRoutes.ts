import express from 'express';
import { getWeather, getLocation } from '../controllers/weatherController';

const router = express.Router();

// 获取天气数据
router.get('/', getWeather);

// 获取当前IP的位置信息
router.get('/location', getLocation);

export default router; 