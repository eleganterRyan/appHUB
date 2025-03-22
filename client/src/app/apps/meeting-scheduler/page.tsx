'use client';

import React from 'react';
import Link from 'next/link';
import TimeGrid from './components/TimeGrid';
import { MeetingProvider } from './context/MeetingContext';

export default function MeetingScheduler() {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900">
            会议时间安排
          </h2>
          <p className="mt-3 text-xl text-gray-500">
            寻找所有人都可用的时间段
          </p>
          <p className="mt-2 text-sm text-gray-500">
            最多允许5名用户同时参与选择
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <MeetingProvider>
            <TimeGrid />
          </MeetingProvider>
        </div>
        
        {/* 数据说明 */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>所有数据仅存储在您的浏览器中，不会上传到服务器</p>
          <p>当您关闭页面时，您的选择记录将被自动删除</p>
        </div>
      </div>
    </div>
  );
} 