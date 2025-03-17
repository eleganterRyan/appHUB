import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AppHUB - 关于',
  description: '关于AppHUB应用及其创建者',
}

export default function About() {
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
            关于 AppHUB
          </h2>
          <p className="mt-3 text-xl text-gray-500">
            一站式应用中心，集成多种实用工具
          </p>
        </div>

        <div className="card mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">项目介绍</h3>
          <p className="text-gray-700 mb-4">
            AppHUB是一个集成多种实用小工具的Web应用平台。用户可以在一个统一的界面中访问和使用各种实用工具，包括待办事项管理、计算器、天气查询和Excel处理工具等。
          </p>
          <p className="text-gray-700 mb-4">
            该项目采用现代化的技术栈构建，前端基于Next.js和Tailwind CSS，后端使用Express和PostgreSQL，提供了响应式设计和用户友好的界面。
          </p>
        </div>

        <div className="card mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">创建者信息</h3>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-32 h-32 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
              ER
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">eleganterRyan</h4>
              <p className="text-gray-700 mt-2">
                全栈开发者，热衷于创建实用且美观的Web应用。擅长React、Next.js、Node.js和数据库技术，注重用户体验和代码质量。
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">Next.js</span>
                <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">React</span>
                <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">TypeScript</span>
                <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">Node.js</span>
                <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">Express</span>
                <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">PostgreSQL</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-4">技术栈</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">前端</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Next.js - React框架</li>
                <li>React - UI库</li>
                <li>TypeScript - 类型安全</li>
                <li>Tailwind CSS - 样式框架</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">后端</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Node.js - JavaScript运行时</li>
                <li>Express - Web框架</li>
                <li>TypeORM - ORM工具</li>
                <li>PostgreSQL - 关系型数据库</li>
                <li>Python - 用于处理Excel文件</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} AppHUB by eleganterRyan. 保留所有权利。</p>
        </div>
      </div>
    </div>
  )
} 