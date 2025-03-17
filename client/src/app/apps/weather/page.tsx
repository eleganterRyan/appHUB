'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// API基础URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface WeatherData {
  location: string
  temperature: number
  description: string
  humidity: number
  windSpeed: number
  icon: string
}

interface ForecastDay {
  date: string
  day: string
  temperature: {
    high: number
    low: number
  }
  description: string
  icon: string
  precipitation: string
}

interface WeatherForecast extends WeatherData {
  forecast: ForecastDay[]
}

interface LocationInfo {
  ip: string
  city: string
  region: string
  country: string
  latitude: number
  longitude: number
}

// 获取天气图标的背景色
const getWeatherBgColor = (icon: string) => {
  // 根据图标代码返回合适的背景色
  if (icon.startsWith('01')) return 'from-yellow-400 to-orange-300'; // 晴天
  if (icon.startsWith('02')) return 'from-blue-300 to-blue-200'; // 少云
  if (icon.startsWith('03') || icon.startsWith('04')) return 'from-gray-300 to-gray-200'; // 多云
  if (icon.startsWith('09') || icon.startsWith('10')) return 'from-blue-400 to-blue-300'; // 雨
  if (icon.startsWith('11')) return 'from-gray-600 to-gray-500'; // 雷雨
  if (icon.startsWith('13')) return 'from-blue-100 to-gray-100'; // 雪
  if (icon.startsWith('50')) return 'from-gray-400 to-gray-300'; // 雾
  return 'from-blue-200 to-blue-100'; // 默认
};

// 获取天气图标的文本颜色
const getWeatherTextColor = (icon: string) => {
  if (icon.startsWith('01')) return 'text-orange-600'; // 晴天
  if (icon.startsWith('02')) return 'text-blue-600'; // 少云
  if (icon.startsWith('03') || icon.startsWith('04')) return 'text-gray-600'; // 多云
  if (icon.startsWith('09') || icon.startsWith('10')) return 'text-blue-600'; // 雨
  if (icon.startsWith('11')) return 'text-gray-700'; // 雷雨
  if (icon.startsWith('13')) return 'text-blue-500'; // 雪
  if (icon.startsWith('50')) return 'text-gray-600'; // 雾
  return 'text-blue-600'; // 默认
};

// 获取天气描述的图标
const getWeatherIcon = (description: string) => {
  if (description.includes('晴')) return '☀️';
  if (description.includes('多云')) return '⛅';
  if (description.includes('阴')) return '☁️';
  if (description.includes('雨') && description.includes('雷')) return '⛈️';
  if (description.includes('雨')) return '🌧️';
  if (description.includes('雪')) return '❄️';
  if (description.includes('雾')) return '🌫️';
  return '🌤️'; // 默认
};

export default function WeatherApp() {
  const [city, setCity] = useState('')
  const [weather, setWeather] = useState<WeatherForecast | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null)
  const [autoDetectLocation, setAutoDetectLocation] = useState(true)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // 组件加载时自动获取位置和天气
  useEffect(() => {
    if (autoDetectLocation) {
      fetchLocationAndWeather();
    }
    
    // 从本地存储加载最近搜索记录
    const savedSearches = localStorage.getItem('recentWeatherSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  // 获取位置信息和天气
  const fetchLocationAndWeather = async () => {
    setLoading(true);
    setError(null);

    try {
      // 获取位置信息
      const locationResponse = await fetch(`${API_BASE_URL}/weather/location`);
      if (!locationResponse.ok) {
        throw new Error('获取位置信息失败');
      }

      const locationData = await locationResponse.json();
      setLocationInfo(locationData);
      
      // 使用获取到的城市名称查询天气
      await fetchWeatherByCity(locationData.city);
    } catch (err) {
      console.error('自动获取位置和天气失败:', err);
      setError('无法自动获取您的位置，请手动输入城市');
      setLoading(false);
    }
  };

  // 根据城市名称获取天气
  const fetchWeatherByCity = async (cityName: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/weather?city=${encodeURIComponent(cityName)}`);
      
      if (!response.ok) {
        throw new Error(`获取天气数据失败: ${response.status}`);
      }
      
      const data = await response.json();
      setWeather(data);
      setCity(cityName);
      
      // 更新最近搜索记录
      updateRecentSearches(cityName);
    } catch (err) {
      console.error('获取天气数据失败:', err);
      setError('获取天气数据失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 更新最近搜索记录
  const updateRecentSearches = (cityName: string) => {
    const updatedSearches = [cityName, ...recentSearches.filter(c => c !== cityName)].slice(0, 5);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentWeatherSearches', JSON.stringify(updatedSearches));
  };

  // 手动搜索天气
  const handleSearch = () => {
    if (!city.trim()) return;
    setAutoDetectLocation(false);
    fetchWeatherByCity(city);
  };

  // 使用当前位置
  const useCurrentLocation = () => {
    setAutoDetectLocation(true);
    fetchLocationAndWeather();
  };

  // 使用最近搜索的城市
  const useRecentCity = (cityName: string) => {
    setCity(cityName);
    setAutoDetectLocation(false);
    fetchWeatherByCity(cityName);
  };

  // 格式化日期
  const formatDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    };
    return now.toLocaleDateString('zh-CN', options);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-2xl font-bold text-primary-600">AppHUB</Link>
              </div>
            </div>
            <div className="flex items-center">
              <Link href="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                返回首页
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900">
            天气查询
          </h2>
          <p className="mt-3 text-xl text-gray-500">
            查看全球各地近一周天气情况
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {formatDate()}
          </p>
        </div>

        <div className="card mb-8">
          {/* 搜索框 */}
          <div className="flex mb-4">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="输入城市名称..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="btn btn-primary rounded-l-none"
            >
              {loading ? '查询中...' : '查询'}
            </button>
          </div>

          {/* 使用当前位置按钮 */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={useCurrentLocation}
              disabled={loading}
              className="text-primary-600 hover:text-primary-800 text-sm flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              使用当前位置
            </button>
            
            {loading && <div className="text-sm text-gray-500">正在加载天气数据...</div>}
          </div>

          {/* 最近搜索 */}
          {recentSearches.length > 0 && (
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-2">最近搜索:</div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((recentCity, index) => (
                  <button
                    key={index}
                    onClick={() => useRecentCity(recentCity)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700"
                  >
                    {recentCity}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 位置信息 */}
          {locationInfo && autoDetectLocation && (
            <div className="mb-4 text-sm text-gray-600">
              <p>当前位置: {locationInfo.city}, {locationInfo.region}, {locationInfo.country}</p>
            </div>
          )}

          {/* 错误信息 */}
          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-md mb-6">
              {error}
            </div>
          )}
        </div>

        {/* 当前天气信息 */}
        {weather && (
          <div className={`card bg-gradient-to-br ${getWeatherBgColor(weather.icon)} mb-8 shadow-lg`}>
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0">
                <h3 className="text-2xl font-bold text-gray-900">{weather.location}</h3>
                <div className="flex items-center mt-2">
                  <img 
                    src={`https://openweathermap.org/img/wn/${weather.icon}@4x.png`} 
                    alt={weather.description}
                    className="w-24 h-24"
                  />
                  <div className="ml-2">
                    <div className="text-5xl font-bold text-gray-900">{weather.temperature}°C</div>
                    <div className="text-xl text-gray-800 flex items-center">
                      {getWeatherIcon(weather.description)} {weather.description}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 bg-white bg-opacity-30 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-gray-700 font-medium">湿度</div>
                  <div className="text-xl font-semibold text-gray-900">{weather.humidity}%</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-700 font-medium">风速</div>
                  <div className="text-xl font-semibold text-gray-900">{weather.windSpeed} km/h</div>
                </div>
                <div className="text-center col-span-2">
                  <div className="text-gray-700 font-medium">今日温度范围</div>
                  <div className="flex justify-center items-center space-x-2">
                    <span className="text-blue-600">{weather.forecast[0]?.temperature.low}°</span>
                    <span className="text-gray-500">~</span>
                    <span className="text-red-600">{weather.forecast[0]?.temperature.high}°</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 一周天气预报 */}
        {weather && weather.forecast && weather.forecast.length > 0 && (
          <div className="card shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-6">一周天气预报</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
              {weather.forecast.map((day, index) => (
                <div 
                  key={index} 
                  className={`bg-gradient-to-b ${getWeatherBgColor(day.icon)} p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow`}
                >
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{day.day}</div>
                    <div className="text-sm text-gray-700">{day.date}</div>
                    <img 
                      src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`} 
                      alt={day.description}
                      className="w-16 h-16 mx-auto"
                    />
                    <div className="text-sm font-medium text-gray-900 flex items-center justify-center">
                      {getWeatherIcon(day.description)} {day.description}
                    </div>
                    <div className="flex justify-center items-center space-x-2 mt-1">
                      <span className="text-red-600 font-bold">{day.temperature.high}°</span>
                      <span className="text-gray-500">|</span>
                      <span className="text-blue-600 font-bold">{day.temperature.low}°</span>
                    </div>
                    <div className="text-xs text-gray-700 mt-1 font-medium">
                      降水: {day.precipitation}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 天气信息来源 */}
        {weather && (
          <div className="mt-8 text-center text-xs text-gray-500">
            数据来源: OpenWeatherMap API | 更新时间: {new Date().toLocaleTimeString('zh-CN')}
          </div>
        )}
      </div>
    </div>
  )
} 