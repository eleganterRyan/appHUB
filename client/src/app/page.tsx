import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AppHUB - 首页',
  description: '欢迎来到AppHUB，您的一站式应用中心',
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-primary-600">AppHUB</h1>
              </div>
            </div>
            <div className="flex items-center">
              <Link href="/about" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                关于
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            欢迎来到 AppHUB
          </h2>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            您的一站式应用中心，包含多种实用小工具
          </p>
        </div>

        {/* 应用卡片网格 */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* 待办事项应用 */}
          <Link href="/apps/todo" className="card hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-primary-100 rounded-md flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">待办事项</h3>
            <p className="mt-2 text-sm text-gray-500">管理您的任务和待办事项</p>
          </Link>

          {/* 计算器应用 */}
          <Link href="/apps/calculator" className="card hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-primary-100 rounded-md flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">计算器</h3>
            <p className="mt-2 text-sm text-gray-500">简单易用的计算器工具</p>
          </Link>

          {/* 天气应用 */}
          <Link href="/apps/weather" className="card hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-primary-100 rounded-md flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">天气查询</h3>
            <p className="mt-2 text-sm text-gray-500">查看全球各地天气情况</p>
          </Link>

          {/* Excel合并工具 */}
          <Link href="/apps/excel-merger" className="card hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-primary-100 rounded-md flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Excel合并工具</h3>
            <p className="mt-2 text-sm text-gray-500">合并多个Excel文件为一个文件</p>
          </Link>
        </div>
      </div>

      {/* 页脚 */}
      <footer className="bg-white mt-24">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} AppHUB. 保留所有权利。
          </p>
        </div>
      </footer>
    </div>
  )
} 