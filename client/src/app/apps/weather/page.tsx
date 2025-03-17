'use client'

import { useState } from 'react'
import Link from 'next/link'

interface WeatherData {
  location: string
  temperature: number
  description: string
  humidity: number
  windSpeed: number
  icon: string
}

export default function WeatherApp() {
  const [city, setCity] = useState('')
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWeather = async () => {
    if (!city.trim()) return

    setLoading(true)
    setError(null)

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟天气数据
      const mockWeatherData: WeatherData = {
        location: city,
        temperature: Math.floor(Math.random() * 30) + 5, // 5-35°C
        description: ['晴朗', '多云', '小雨', '阵雨', '雷阵雨', '小雪'][Math.floor(Math.random() * 6)],
        humidity: Math.floor(Math.random() * 50) + 30, // 30-80%
        windSpeed: Math.floor(Math.random() * 30) + 5, // 5-35 km/h
        icon: ['01d', '02d', '03d', '04d', '09d', '10d', '11d', '13d'][Math.floor(Math.random() * 8)]
      }
      
      setWeather(mockWeatherData)
    } catch (err) {
      setError('获取天气数据失败，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

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
            查看全球各地天气情况
          </p>
        </div>

        <div className="card mb-8">
          {/* 搜索框 */}
          <div className="flex mb-6">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchWeather()}
              placeholder="输入城市名称..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
            />
            <button
              onClick={fetchWeather}
              disabled={loading}
              className="btn btn-primary rounded-l-none"
            >
              {loading ? '查询中...' : '查询'}
            </button>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-md mb-6">
              {error}
            </div>
          )}
        </div>

        {/* 天气信息 */}
        {weather && (
          <div className="card bg-gradient-to-br from-blue-50 to-white">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0">
                <h3 className="text-2xl font-bold text-gray-900">{weather.location}</h3>
                <div className="flex items-center mt-2">
                  <img 
                    src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} 
                    alt={weather.description}
                    className="w-16 h-16"
                  />
                  <div className="ml-2">
                    <div className="text-4xl font-bold">{weather.temperature}°C</div>
                    <div className="text-gray-600">{weather.description}</div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-gray-500">湿度</div>
                  <div className="text-xl font-semibold">{weather.humidity}%</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500">风速</div>
                  <div className="text-xl font-semibold">{weather.windSpeed} km/h</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 