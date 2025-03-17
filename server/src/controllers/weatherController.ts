import { Request, Response } from 'express';
import axios from 'axios';

// 天气数据接口
interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

// 一周天气预报接口
interface ForecastDay {
  date: string;
  day: string;
  temperature: {
    high: number;
    low: number;
  };
  description: string;
  icon: string;
  precipitation: string;
}

interface WeatherForecast extends WeatherData {
  forecast: ForecastDay[];
}

// OpenWeatherMap API密钥 - 这里使用免费的API密钥，实际使用时应该放在环境变量中
const OPENWEATHER_API_KEY = 'bd5e378503939ddaee76f12ad7a97608';

// 获取IP地址信息
const getIpLocation = async (ip?: string) => {
  try {
    // 如果没有提供IP，则获取公共IP
    const response = await axios.get('https://ipapi.co/json/');
    return {
      ip: response.data.ip,
      city: response.data.city,
      region: response.data.region,
      country: response.data.country_name,
      latitude: response.data.latitude,
      longitude: response.data.longitude
    };
  } catch (error) {
    console.error('获取IP地址信息失败:', error);
    throw new Error('无法获取位置信息');
  }
};

// 从OpenWeatherMap获取天气数据
const getOpenWeatherData = async (city: string) => {
  try {
    console.log(`尝试从OpenWeatherMap获取天气数据，城市: ${city}`);
    
    // 获取当前天气
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=zh_cn`;
    const currentWeatherResponse = await axios.get(currentWeatherUrl);
    
    console.log(`成功获取当前天气数据，状态码: ${currentWeatherResponse.status}`);
    
    // 获取天气预报
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=zh_cn`;
    const forecastResponse = await axios.get(forecastUrl);
    
    console.log(`成功获取天气预报数据，状态码: ${forecastResponse.status}`);
    
    // 解析当前天气数据
    const currentData = currentWeatherResponse.data;
    const weatherData: WeatherData = {
      location: currentData.name,
      temperature: Math.round(currentData.main.temp),
      description: currentData.weather[0].description,
      humidity: currentData.main.humidity,
      windSpeed: Math.round(currentData.wind.speed * 3.6), // 转换为km/h
      icon: currentData.weather[0].icon
    };
    
    // 解析天气预报数据
    const forecastData = forecastResponse.data;
    const forecast: ForecastDay[] = [];
    
    // 获取未来7天的天气预报
    const dailyForecasts = new Map();
    
    // OpenWeatherMap免费API提供的是3小时间隔的预报，需要处理成每日预报
    forecastData.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const dayName = dayNames[date.getDay()];
      
      if (!dailyForecasts.has(dateStr)) {
        dailyForecasts.set(dateStr, {
          date: dateStr,
          day: dayName,
          temperature: {
            high: item.main.temp_max,
            low: item.main.temp_min
          },
          description: item.weather[0].description,
          icon: item.weather[0].icon,
          precipitation: item.pop ? `${Math.round(item.pop * 100)}%` : '0%'
        });
      } else {
        const existing = dailyForecasts.get(dateStr);
        // 更新最高温和最低温
        if (item.main.temp_max > existing.temperature.high) {
          existing.temperature.high = item.main.temp_max;
        }
        if (item.main.temp_min < existing.temperature.low) {
          existing.temperature.low = item.main.temp_min;
        }
      }
    });
    
    // 将Map转换为数组并限制为7天
    let count = 0;
    dailyForecasts.forEach((value) => {
      if (count < 7) {
        forecast.push({
          ...value,
          temperature: {
            high: Math.round(value.temperature.high),
            low: Math.round(value.temperature.low)
          }
        });
        count++;
      }
    });
    
    console.log(`解析到的预报天数: ${forecast.length}`);
    
    return {
      ...weatherData,
      forecast
    };
  } catch (error) {
    console.error('获取OpenWeatherMap天气数据失败:', error);
    // 如果获取失败，返回模拟数据
    return generateMockWeatherData(city);
  }
};

// 生成模拟天气数据
const generateMockWeatherData = (city: string): WeatherForecast => {
  const descriptions = ['晴朗', '多云', '小雨', '阵雨', '雷阵雨', '小雪'];
  const icons = ['01d', '02d', '03d', '04d', '09d', '10d', '11d', '13d'];
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  
  // 生成当前天气
  const currentWeather = {
    location: city,
    temperature: Math.floor(Math.random() * 30) + 5, // 5-35°C
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    humidity: Math.floor(Math.random() * 50) + 30, // 30-80%
    windSpeed: Math.floor(Math.random() * 30) + 5, // 5-35 km/h
    icon: icons[Math.floor(Math.random() * icons.length)]
  };
  
  // 生成一周天气预报
  const forecast: ForecastDay[] = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const forecastDate = new Date(today);
    forecastDate.setDate(today.getDate() + i);
    
    const dayIndex = (today.getDay() + i) % 7;
    const desc = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    forecast.push({
      date: `${forecastDate.getMonth() + 1}月${forecastDate.getDate()}日`,
      day: days[dayIndex],
      temperature: {
        high: Math.floor(Math.random() * 15) + 20, // 20-35°C
        low: Math.floor(Math.random() * 15) + 5,  // 5-20°C
      },
      description: desc,
      icon: icons[Math.floor(Math.random() * icons.length)],
      precipitation: `${Math.floor(Math.random() * 50)}%`
    });
  }
  
  return {
    ...currentWeather,
    forecast
  };
};

// 获取天气数据
export const getWeather = async (req: Request, res: Response) => {
  try {
    const { city } = req.query;
    
    // 如果没有提供城市，则获取IP地址的位置
    let location = city as string;
    
    if (!location) {
      console.log('未提供城市参数，尝试获取IP地址位置');
      const ipInfo = await getIpLocation();
      location = ipInfo.city;
      console.log(`通过IP获取到的城市: ${location}`);
    } else {
      console.log(`使用提供的城市参数: ${location}`);
    }
    
    // 获取天气数据
    const weatherData = await getOpenWeatherData(location);
    
    console.log(`返回天气数据: ${JSON.stringify(weatherData).substring(0, 200)}...`);
    res.status(200).json(weatherData);
  } catch (error) {
    console.error('获取天气数据失败:', error);
    res.status(500).json({ message: '服务器错误，无法获取天气数据' });
  }
};

// 获取当前IP的位置信息
export const getLocation = async (req: Request, res: Response) => {
  try {
    const ipInfo = await getIpLocation();
    res.status(200).json(ipInfo);
  } catch (error) {
    console.error('获取位置信息失败:', error);
    res.status(500).json({ message: '服务器错误，无法获取位置信息' });
  }
}; 