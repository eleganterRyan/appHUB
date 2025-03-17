import { Request, Response } from 'express';

// 模拟天气数据
interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

// 获取天气数据
export const getWeather = async (req: Request, res: Response) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({ message: '请提供城市名称' });
    }

    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    // 生成模拟天气数据
    const weatherData: WeatherData = {
      location: city as string,
      temperature: Math.floor(Math.random() * 30) + 5, // 5-35°C
      description: ['晴朗', '多云', '小雨', '阵雨', '雷阵雨', '小雪'][Math.floor(Math.random() * 6)],
      humidity: Math.floor(Math.random() * 50) + 30, // 30-80%
      windSpeed: Math.floor(Math.random() * 30) + 5, // 5-35 km/h
      icon: ['01d', '02d', '03d', '04d', '09d', '10d', '11d', '13d'][Math.floor(Math.random() * 8)]
    };

    res.status(200).json(weatherData);
  } catch (error) {
    console.error('获取天气数据失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
}; 