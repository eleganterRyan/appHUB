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
          {/* 人类的玩具应用 */}
          <Link href="/apps/human-toys" className="card hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-primary-100 rounded-md flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">人类的玩具</h3>
            <p className="mt-2 text-sm text-gray-500">先进的大模型AI对话系统</p>
          </Link>
          
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
          <a href="https://mathda.com/calculator/zh-CN" target="_blank" rel="noopener noreferrer" className="card hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-primary-100 rounded-md flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">计算器</h3>
            <p className="mt-2 text-sm text-gray-500">简单易用的计算器工具 (MathDa)</p>
          </a>

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
            <h3 className="text-lg font-medium text-gray-900">Excel处理工具</h3>
            <p className="mt-2 text-sm text-gray-500">合并或拆分Excel文件，提高数据处理效率</p>
          </Link>
          
          {/* 会议时间确定应用 */}
          <Link href="/apps/meeting-scheduler" className="card hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-primary-100 rounded-md flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">会议时间确定</h3>
            <p className="mt-2 text-sm text-gray-500">多人协作选择共同可用的会议时间</p>
          </Link>
          
          {/* DeepSeek AI应用 */}
          <a href="https://chat.deepseek.com/" target="_blank" rel="noopener noreferrer" className="card hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-primary-100 rounded-md flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">deepseek</h3>
            <p className="mt-2 text-sm text-gray-500">先进的人工智能对话模型</p>
          </a>
          
          {/* 会议室预约应用 */}
          <a href="http://192.168.1.99:5173" target="_blank" rel="noopener noreferrer" className="card hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-primary-100 rounded-md flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">会议室预约</h3>
            <p className="mt-2 text-sm text-gray-500">便捷的会议室预约与管理系统</p>
          </a>
          
          {/* 监考招募应用 */}
          <Link href="/apps/exam-proctor" className="card hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-primary-100 rounded-md flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">监考招募</h3>
            <p className="mt-2 text-sm text-gray-500">考试监考人员在线招募与管理平台</p>
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