'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  expiresAt: number;
  deadline?: number; // 可选的DDL时间戳，如果不设置则默认使用expiresAt
}

// 计算100天后的时间戳
const getExpiryTimestamp = (): number => {
  const now = new Date();
  const hundredDaysLater = new Date(now);
  hundredDaysLater.setDate(now.getDate() + 100);
  return hundredDaysLater.getTime();
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

// 为window对象添加testNotification属性，解决TypeScript错误
declare global {
  interface Window {
    testNotification?: Notification;
  }
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [showExpiring, setShowExpiring] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [useCustomDeadline, setUseCustomDeadline] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<string>('');

  // 页面自动刷新 - 每4小时刷新一次
  useEffect(() => {
    // 4小时的毫秒数
    const fourHoursInMs = 4 * 60 * 60 * 1000;
    
    // 设置定时器自动刷新
    const refreshInterval = setInterval(() => {
      console.log('执行4小时定时刷新');
      window.location.reload();
    }, fourHoursInMs);
    
    // 清理函数
    return () => clearInterval(refreshInterval);
  }, []);

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

  // 格式化日期为YYYY-MM-DD格式，用于日期选择器
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 格式化时间为HH:MM格式，用于时间选择器
  const formatTimeForInput = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 初始化日期时间选择器
  useEffect(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 100); // 默认100天后
    setSelectedDate(formatDateForInput(defaultDate));
    setSelectedTime('23:59'); // 默认为当天的23:59
  }, []);

  // 计算DDL时间戳
  const getDeadlineTimestamp = (): number => {
    if (!useCustomDeadline) {
      return getExpiryTimestamp(); // 使用默认的100天过期时间
    }

    if (!selectedDate) {
      return getExpiryTimestamp();
    }

    const [year, month, day] = selectedDate.split('-').map(Number);
    const [hours, minutes] = selectedTime ? selectedTime.split(':').map(Number) : [23, 59];
    
    const deadlineDate = new Date(year, month - 1, day, hours, minutes);
    return deadlineDate.getTime();
  };

  // 添加新待办事项
  const addTodo = () => {
    if (input.trim() === '') return;
    
    const now = new Date().getTime();
    const expiryTime = getExpiryTimestamp();
    const deadlineTime = getDeadlineTimestamp();
    
    const newTodo: Todo = {
      id: `todo-${now}-${Math.random().toString(36).substr(2, 9)}`,
      text: input.trim(),
      completed: false,
      createdAt: now,
      expiresAt: expiryTime,
      deadline: useCustomDeadline ? deadlineTime : undefined
    };
    
    const updatedTodos = [...todos, newTodo];
    saveTodos(updatedTodos);
    setInput('');
    setUseCustomDeadline(false); // 重置为默认状态
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

  // 格式化显示剩余时间
  const formatRemainingTime = (timestamp: number): string => {
    const now = new Date().getTime();
    const diff = timestamp - now;
    
    // 如果已过期
    if (diff <= 0) return '已过期';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}天${hours}小时后截止`;
    } else if (hours > 0) {
      return `${hours}小时${minutes}分钟后截止`;
    } else {
      return `${minutes}分钟后截止`;
    }
  };
  
  // 修改通知检查函数，改为弹出新窗口显示临期任务
  useEffect(() => {
    if (!("Notification" in window)) {
      console.log("浏览器不支持系统通知");
      return;
    }

    // 用于记录已发送通知的任务ID，避免重复通知
    const sentNotifications = new Set();

    // 创建一个用于显示任务详情的HTML
    const createTaskDetailHTML = (todo: Todo, daysDiff: number) => {
      const deadline = todo.deadline || todo.expiresAt;
      const deadlineDate = new Date(deadline);
      
      // 通过模板字符串创建HTML内容
      return `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>待办事项提醒</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9fafb;
            }
            .task-card {
              background-color: white;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              padding: 20px;
              margin-top: 20px;
            }
            .task-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 15px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 10px;
            }
            .task-title {
              font-size: 24px;
              font-weight: bold;
              color: #111;
            }
            .urgency-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 9999px;
              font-size: 14px;
              font-weight: 500;
              background-color: ${
                daysDiff === 1 ? '#fecaca' : 
                daysDiff === 2 ? '#fee2e2' : 
                '#fed7aa'
              };
              color: ${
                daysDiff === 1 ? '#991b1b' : 
                daysDiff === 2 ? '#b91c1c' : 
                '#9a3412'
              };
            }
            .task-info {
              margin-bottom: 20px;
            }
            .task-info p {
              margin: 5px 0;
            }
            .deadline-time {
              font-weight: bold;
              color: ${
                daysDiff === 1 ? '#dc2626' : 
                daysDiff === 2 ? '#ef4444' : 
                '#ea580c'
              };
            }
            .actions {
              text-align: center;
              margin-top: 30px;
            }
            .btn {
              padding: 8px 16px;
              border-radius: 4px;
              border: none;
              cursor: pointer;
              font-weight: 500;
              margin: 0 5px;
            }
            .btn-primary {
              background-color: #3b82f6;
              color: white;
            }
            .btn-primary:hover {
              background-color: #2563eb;
            }
            .btn-secondary {
              background-color: #e5e7eb;
              color: #4b5563;
            }
            .btn-secondary:hover {
              background-color: #d1d5db;
            }
            .created-date, .footer {
              font-size: 12px;
              color: #6b7280;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <h1>⚠️ 待办事项提醒</h1>
          <p>您有一个待办事项即将到期，请及时处理！</p>
          
          <div class="task-card">
            <div class="task-header">
              <div class="task-title">${todo.text}</div>
              <div class="urgency-badge">${
                daysDiff === 1 ? '明天截止' : 
                daysDiff === 2 ? '2天后截止' : 
                '3天后截止'
              }</div>
            </div>
            
            <div class="task-info">
              <p><strong>截止时间:</strong> <span class="deadline-time">${deadlineDate.toLocaleString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })}</span></p>
              <p><strong>剩余时间:</strong> ${daysDiff} 天</p>
              <p><strong>状态:</strong> ${todo.completed ? '已完成' : '未完成'}</p>
            </div>
            
            <div class="actions">
              <button class="btn btn-primary" onclick="window.opener.focus(); window.close();">返回并处理</button>
              <button class="btn btn-secondary" onclick="window.close();">关闭提醒</button>
            </div>
            
            <div class="created-date">
              创建于: ${new Date(todo.createdAt).toLocaleString('zh-CN')}
            </div>
          </div>
          
          <div class="footer">
            <p>此提醒由 AppHUB 待办事项应用自动生成</p>
          </div>
        </body>
        </html>
      `;
    };

    // 检查DDL并弹出提醒窗口
    const checkDeadlines = () => {
      const now = new Date().getTime();
      
      todos.forEach(todo => {
        if (todo.completed) return; // 已完成的任务不提醒
        
        const deadline = todo.deadline || todo.expiresAt;
        const timeDiff = deadline - now;
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        // 在距离DDL还有3天、2天或1天时，且之前没有发送过通知的任务才弹出提醒
        const notificationKey = `${todo.id}_${daysDiff}`;
        if ((daysDiff === 3 || daysDiff === 2 || daysDiff === 1) && !sentNotifications.has(notificationKey)) {
          sentNotifications.add(notificationKey); // 标记为已发送
          
          // 创建HTML内容
          const htmlContent = createTaskDetailHTML(todo, daysDiff);
          
          // 弹出新窗口
          const popupWindow = window.open('', `task_reminder_${todo.id}`, 'width=600,height=700');
          if (popupWindow) {
            popupWindow.document.write(htmlContent);
            popupWindow.document.close();
            popupWindow.focus();
            
            // 当原窗口获得焦点时，存储一个标记，以避免再次弹出相同的窗口
            window.addEventListener('focus', function onFocus() {
              localStorage.setItem(`task_viewed_${notificationKey}`, 'true');
              window.removeEventListener('focus', onFocus);
            });
          } else {
            // 如果弹窗被阻止，则回退到通知
            if (Notification.permission === "granted") {
              const notification = new Notification("待办事项提醒", {
                body: `您的任务"${todo.text}"将在${daysDiff}天后截止，请及时处理！弹窗已被浏览器阻止，请允许弹窗。`,
                icon: "/favicon.ico"
              });
              
              notification.onclick = function() {
                window.focus();
                notification.close();
              };
            }
          }
        }
      });
    };
    
    // 一次性检查，不要设置定时器
    if (Notification.permission === "granted") {
      // 在组件挂载后延迟2秒执行，以确保页面完全加载
      const timeoutId = setTimeout(() => {
        checkDeadlines();
      }, 2000);
      
      // 清理函数
      return () => clearTimeout(timeoutId);
    }
    
    return () => {};
  }, [todos]); // 当todos改变时重新检查

  // 修改测试通知函数，使用弹窗代替系统通知
  const testNotification = () => {
    if (!("Notification" in window)) {
      setNotificationStatus("浏览器不支持系统通知");
      return;
    }

    // 创建测试用的待办事项
    const testTodo: Todo = {
      id: 'test-todo-' + Date.now(),
      text: '这是一个测试待办事项，用于展示提醒界面',
      completed: false,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 一天后到期
      deadline: Date.now() + 24 * 60 * 60 * 1000 // 一天后到期
    };

    // 创建HTML内容
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>测试待办事项提醒</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }
          .task-card {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 20px;
            margin-top: 20px;
          }
          .task-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 10px;
          }
          .task-title {
            font-size: 24px;
            font-weight: bold;
            color: #111;
          }
          .test-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 9999px;
            font-size: 14px;
            font-weight: 500;
            background-color: #dbeafe;
            color: #1e40af;
          }
          .task-info {
            margin-bottom: 20px;
          }
          .task-info p {
            margin: 5px 0;
          }
          .deadline-time {
            font-weight: bold;
            color: #2563eb;
          }
          .actions {
            text-align: center;
            margin-top: 30px;
          }
          .btn {
            padding: 8px 16px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            font-weight: 500;
            margin: 0 5px;
          }
          .btn-primary {
            background-color: #3b82f6;
            color: white;
          }
          .btn-primary:hover {
            background-color: #2563eb;
          }
          .btn-secondary {
            background-color: #e5e7eb;
            color: #4b5563;
          }
          .btn-secondary:hover {
            background-color: #d1d5db;
          }
          .created-date, .footer {
            font-size: 12px;
            color: #6b7280;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <h1>🔔 测试待办事项提醒</h1>
        <p>这是一个测试提醒，展示当待办事项即将到期时的界面效果</p>
        
        <div class="task-card">
          <div class="task-header">
            <div class="task-title">${testTodo.text}</div>
            <div class="test-badge">测试提醒</div>
          </div>
          
          <div class="task-info">
            <p><strong>截止时间:</strong> <span class="deadline-time">${new Date(testTodo.deadline!).toLocaleString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })}</span></p>
            <p><strong>剩余时间:</strong> 1 天</p>
            <p><strong>状态:</strong> 未完成</p>
          </div>
          
          <div class="actions">
            <button class="btn btn-primary" onclick="window.opener.focus(); window.close();">返回并处理</button>
            <button class="btn btn-secondary" onclick="window.close();">关闭提醒</button>
          </div>
          
          <div class="created-date">
            创建于: ${new Date(testTodo.createdAt).toLocaleString('zh-CN')}
          </div>
        </div>
        
        <div class="footer">
          <p>此提醒由 AppHUB 待办事项应用自动生成</p>
          <p style="color: #3b82f6; margin-top: 10px;">这是一个测试提醒，真实提醒将在任务距离截止日期还有3天、2天或1天时自动弹出</p>
        </div>
      </body>
      </html>
    `;
    
    try {
      // 打开新窗口
      const popupWindow = window.open('', 'test_reminder', 'width=600,height=700');
      if (popupWindow) {
        // 写入HTML内容
        popupWindow.document.write(htmlContent);
        popupWindow.document.close();
        popupWindow.focus();
        
        setNotificationStatus("测试提醒窗口已打开。如果没有看到弹窗，请检查浏览器是否阻止了弹窗。");
      } else {
        // 如果弹窗被阻止，则回退到系统通知
        if (Notification.permission === "granted") {
          // 清除之前可能存在的通知
          if (window.testNotification) {
            window.testNotification.close();
          }
          
          const notification = new Notification("测试待办事项提醒", {
            body: "弹窗已被浏览器阻止，请允许弹窗以获得更好的提醒效果。",
            icon: "/favicon.ico"
          });
          
          window.testNotification = notification;
          setNotificationStatus("浏览器阻止了弹窗，已使用系统通知代替。请允许弹窗以获得完整体验。");
        } else {
          setNotificationStatus("浏览器阻止了弹窗，且通知权限未被授予。请在浏览器设置中允许弹窗和通知。");
          
          // 请求通知权限
          Notification.requestPermission().then(permission => {
            if (permission === "granted") {
              // 获得权限后，再次尝试发送通知
              testNotification();
            } else {
              setNotificationStatus("通知权限请求被拒绝");
            }
          });
        }
      }
    } catch (error: any) {
      setNotificationStatus(`测试提醒失败: ${error.message}`);
    }
  };

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
            所有待办事项将在创建后100天自动过期
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
          <div className="mb-6">
            <div className="flex mb-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && addTodo()}
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
            
            <div className="flex items-start mb-3">
              <div className="flex items-center h-5">
                <input
                  id="useCustomDeadline"
                  type="checkbox"
                  checked={useCustomDeadline}
                  onChange={(e) => setUseCustomDeadline(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="useCustomDeadline" className="font-medium text-gray-700">
                  设置截止时间 (DDL)
                </label>
                <p className="text-gray-500">如不设置，默认为100天后自动过期</p>
              </div>
            </div>
            
            {useCustomDeadline && (
              <div className="flex flex-wrap gap-4 mb-3 p-3 bg-gray-50 rounded-md">
                <div>
                  <label htmlFor="deadline-date" className="block text-sm font-medium text-gray-700 mb-1">
                    截止日期
                  </label>
                  <input
                    type="date"
                    id="deadline-date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label htmlFor="deadline-time" className="block text-sm font-medium text-gray-700 mb-1">
                    截止时间
                  </label>
                  <input
                    type="time"
                    id="deadline-time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>
            )}

            {/* 通知功能测试区域 */}
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-blue-700">通知功能测试</h4>
                  <p className="text-xs text-blue-600">{notificationStatus || "点击按钮测试系统通知功能"}</p>
                </div>
                <button
                  onClick={testNotification}
                  className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                >
                  测试通知
                </button>
              </div>
            </div>
          </div>

          {/* 分隔线 */}
          <div className="mb-6 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">待办事项列表</h3>
          </div>

          {/* 待办事项列表 */}
          <ul className="divide-y divide-gray-200">
            {todos.length === 0 ? (
              <li className="py-4 text-center text-gray-500">暂无待办事项</li>
            ) : (
              todos.map(todo => (
                <li key={todo.id} className="py-3 flex items-center">
                  <div className="flex items-center flex-1">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center">
                    <span 
                          className={`${todo.completed ? 'line-through text-gray-400' : 'text-gray-900'} flex-grow`}
                    >
                      {todo.text}
                    </span>
                        
                        {/* 将过期信息显示在同一行 */}
                        <span className="text-xs whitespace-nowrap ml-2">
                          {getRemainingDays(todo.expiresAt) <= 2 
                            ? <span className="text-blue-500">
                                {getRemainingDays(todo.expiresAt) === 0 
                                  ? '今天过期删除' 
                                  : `${getRemainingDays(todo.expiresAt)}天后过期删除`}
                              </span>
                            : <span className="text-blue-500">{getRemainingDays(todo.expiresAt)}天后过期删除</span>}
                        </span>
                        
                        {/* 在同一行显示DDL */}
                        {todo.deadline && (
                          <span className={`text-xs ml-2 whitespace-nowrap font-medium ${
                            new Date().getTime() > todo.deadline 
                              ? 'text-red-500' 
                              : (new Date().getTime() + 3 * 24 * 60 * 60 * 1000 > todo.deadline 
                                ? 'text-amber-500' 
                                : 'text-green-600')
                          }`}>
                            DDL: {formatDate(todo.deadline)}
                          </span>
                        )}
                        
                        {/* 将删除按钮放在同一行 */}
                  <button
                    onClick={() => deleteTodo(todo.id)}
                          className="text-red-300 hover:text-red-700 opacity-65 text-xs ml-3"
                  >
                    删除
                  </button>
                      </div>
                    </div>
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
          <p>待办事项将在创建后100天自动删除</p>
        </div>
      </div>
    </div>
  )
} 