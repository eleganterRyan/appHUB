import '@/styles/globals.css'
import type { Metadata } from 'next'
// 移除 Google 字体导入
// import { Inter } from 'next/font/google'

// 使用系统字体
// const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AppHUB - 您的应用中心',
  description: '一站式应用中心，包含多种实用小工具',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      {/* 使用系统字体栈替代 Inter 字体 */}
      <body className="font-sans">
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
} 