import '@/styles/globals.css'
import type { Metadata } from 'next'
import DifyBot from '@/components/DifyBot'
// 移除 Google 字体导入
// import { Inter } from 'next/font/google'

// 使用系统字体
// const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AppHUB',
  description: '您的一站式应用中心',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <head>
        {/* 这里已删除聊天机器人配置 */}
      </head>
      <body className="font-sans">
        <DifyBot />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
} 