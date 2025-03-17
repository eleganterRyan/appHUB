'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CalculatorApp() {
  const router = useRouter()
  
  useEffect(() => {
    // 重定向到MathDa计算器网站
    window.location.href = 'https://mathda.com/calculator/zh-CN'
  }, [])
  
  // 返回一个加载中的界面，在重定向前短暂显示
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">正在跳转到MathDa计算器...</h2>
        <p className="text-gray-600">如果没有自动跳转，请<a href="https://mathda.com/calculator/zh-CN" className="text-primary-600 hover:underline">点击这里</a></p>
      </div>
    </div>
  )
} 