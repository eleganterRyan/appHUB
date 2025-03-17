'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  expiresAt: number;
}

// 计算7天后的时间戳
const getExpiryTimestamp = (): number => {
  const now = new Date();
  const sevenDaysLater = new Date(now);
  sevenDaysLater.setDate(now.getDate() + 7);
  return sevenDaysLater.getTime();
};

// 格式化日期显示
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 计算剩余天数
const getRemainingDays = (expiryTimestamp: number): number => {
  const now = new Date().getTime();
  const diff = expiryTimestamp - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [showExpiring, setShowExpiring] = useState(false);

  // 从本地存储加载待办事项并清理过期项目
  useEffect(() => {
    const loadTodos = () => {
      try {
        const storedTodos = localStorage.getItem('todos');
        if (storedTodos) {
          const parsedTodos: Todo[] = JSON.parse(storedTodos);
          
          // 过滤掉过期的待办事项
          const now = new Date().getTime();
          const validTodos = parsedTodos.filter(todo => todo.expiresAt > now);
          
          // 如果有过期项目被清理，更新本地存储
          if (validTodos.length !== parsedTodos.length) {
            localStorage.setItem('todos', JSON.stringify(validTodos));
          }
          
          setTodos(validTodos);
        }
      } catch (error) {
        console.error('加载待办事项失败:', error);
        // 如果加载失败，清空本地存储并设置为空数组
        localStorage.removeItem('todos');
        setTodos([]);
      }
    };

    loadTodos();
    
    // 设置定时器，每小时检查一次过期项目
    const intervalId = setInterval(loadTodos, 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // 保存待办事项到本地存储
  const saveTodos = (updatedTodos: Todo[]) => {
    localStorage.setItem('todos', JSON.stringify(updatedTodos));
    setTodos(updatedTodos);
  };

  // 添加新待办事项
  const addTodo = () => {
    if (input.trim() === '') return;
    
    const now = new Date().getTime();
    const expiryTime = getExpiryTimestamp();
    
    const newTodo: Todo = {
      id: `todo-${now}-${Math.random().toString(36).substr(2, 9)}`,
      text: input.trim(),
      completed: false,
      createdAt: now,
      expiresAt: expiryTime
    };
    
    const updatedTodos = [...todos, newTodo];
    saveTodos(updatedTodos);
    setInput('');
  };

  // 切换待办事项完成状态
  const toggleTodo = (id: string) => {
    const updatedTodos = todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos(updatedTodos);
  };

  // 删除待办事项
  const deleteTodo = (id: string) => {
    const updatedTodos = todos.filter(todo => todo.id !== id);
    saveTodos(updatedTodos);
  };

  // 清除所有已完成的待办事项
  const clearCompleted = () => {
    const updatedTodos = todos.filter(todo => !todo.completed);
    saveTodos(updatedTodos);
  };

  // 获取即将过期的待办事项（2天内过期）
  const expiringTodos = todos.filter(todo => 
    !todo.completed && getRemainingDays(todo.expiresAt) <= 2
  );

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
            待办事项
          </h2>
          <p className="mt-3 text-xl text-gray-500">
            管理您的任务和待办事项
          </p>
          <p className="mt-2 text-sm text-gray-500">
            所有待办事项将在创建后7天自动过期
          </p>
        </div>

        {/* 即将过期提醒 */}
        {expiringTodos.length > 0 && (
          <div className="mb-6">
            <button 
              onClick={() => setShowExpiring(!showExpiring)}
              className="flex items-center text-amber-600 hover:text-amber-800 font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              有 {expiringTodos.length} 个待办事项即将过期
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ml-1 transition-transform ${showExpiring ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {showExpiring && (
              <div className="mt-2 bg-amber-50 p-4 rounded-md border border-amber-200">
                <h4 className="font-medium text-amber-800 mb-2">即将过期的待办事项：</h4>
                <ul className="space-y-2">
                  {expiringTodos.map(todo => (
                    <li key={todo.id} className="flex justify-between items-center">
                      <span className="text-gray-800">{todo.text}</span>
                      <span className="text-amber-600 text-sm">
                        {getRemainingDays(todo.expiresAt) === 0 
                          ? '今天过期' 
                          : `${getRemainingDays(todo.expiresAt)}天后过期`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="card">
          {/* 添加待办事项 */}
          <div className="flex mb-6">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTodo()}
              placeholder="添加新的待办事项..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
            />
            <button
              onClick={addTodo}
              className="btn btn-primary rounded-l-none"
            >
              添加
            </button>
          </div>

          {/* 待办事项列表 */}
          <ul className="divide-y divide-gray-200">
            {todos.length === 0 ? (
              <li className="py-4 text-center text-gray-500">暂无待办事项</li>
            ) : (
              todos.map(todo => (
                <li key={todo.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between">
                  <div className="flex items-center flex-1">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="ml-3 flex-1 flex items-center justify-between">
                      <span 
                        className={`${todo.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}
                      >
                        {todo.text}
                      </span>
                      <span className="text-xs text-blue-500 ml-2">
                        {getRemainingDays(todo.expiresAt) <= 2 
                          ? <span className="text-blue-500">
                              {getRemainingDays(todo.expiresAt) === 0 
                                ? '今天过期自动删除' 
                                : `${getRemainingDays(todo.expiresAt)}天后过期自动删除`}
                            </span>
                          : `${getRemainingDays(todo.expiresAt)}天后过期自动删除`}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-0 sm:ml-4 flex items-center">
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="text-red-300 hover:text-red-700 opacity-65 text-xs"
                    >
                      删除
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
          
          {/* 底部操作栏 */}
          {todos.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                共 {todos.length} 项，已完成 {todos.filter(t => t.completed).length} 项
              </span>
              <button
                onClick={clearCompleted}
                className="text-sm text-gray-600 hover:text-gray-900"
                disabled={!todos.some(t => t.completed)}
              >
                清除已完成
              </button>
            </div>
          )}
        </div>
        
        {/* 数据说明 */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>所有数据仅存储在您的浏览器中，不会上传到服务器</p>
          <p>待办事项将在创建后7天自动删除</p>
        </div>
      </div>
    </div>
  )
} 