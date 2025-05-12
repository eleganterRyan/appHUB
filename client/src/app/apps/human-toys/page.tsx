'use client'

import { useEffect } from 'react'

export default function HumanToysPage() {
  useEffect(() => {
    // 在客户端渲染后执行iframe相关逻辑
    const iframe = document.getElementById('ai-chat-iframe') as HTMLIFrameElement
    if (iframe) {
      // 可以在这里添加iframe加载完成后的处理逻辑
      iframe.onload = () => {
        console.log('iframe loaded')
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <a href="/" className="text-2xl font-bold text-primary-600">AppHUB</a>
              </div>
              <div className="ml-6 flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">人类的玩具</h1>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <iframe
            id="ai-chat-iframe"
            src="http://localhost/chatbot/kvHlCawO15fpKclP"
            style={{width: '100%', height: '100%', minHeight: '700px'}}
            frameBorder="0"
            allow="microphone"
          ></iframe>
        </div>
      </div>

      {/* 页脚 */}
      <footer className="bg-white mt-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} AppHUB. 保留所有权利。
          </p>
        </div>
      </footer>
    </div>
  )
} 