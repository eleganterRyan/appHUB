'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// 监考任务类型定义
interface ExamTask {
  id: string;
  title: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  location: string;
  requiredProctors: number;
  currentProctors: number;
  description: string;
}

// 报名信息类型定义
interface Registration {
  taskId: string;
  name: string;
  phone: string;
  email: string;
  timestamp: number;
}

export default function ExamProctorApp() {
  // 状态定义
  const [examTasks, setExamTasks] = useState<ExamTask[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedTask, setSelectedTask] = useState<ExamTask | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    agreement: false
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    phone: '',
    email: '',
    agreement: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 初始化加载默认的考试任务
  useEffect(() => {
    // 模拟从API加载数据
    const defaultTasks: ExamTask[] = [
      {
        id: '1',
        title: '2023年秋季学期期末考试',
        date: '2023-12-20',
        timeStart: '08:30',
        timeEnd: '10:30',
        location: '主教学楼101',
        requiredProctors: 4,
        currentProctors: 2,
        description: '高等数学I期末考试，需要4名监考人员'
      },
      {
        id: '2',
        title: '2023年秋季学期期末考试',
        date: '2023-12-20',
        timeStart: '13:00',
        timeEnd: '15:00',
        location: '主教学楼205',
        requiredProctors: 3,
        currentProctors: 0,
        description: '线性代数期末考试，需要3名监考人员'
      },
      {
        id: '3',
        title: '2023年秋季学期期末考试',
        date: '2023-12-21',
        timeStart: '08:30',
        timeEnd: '10:30',
        location: '科学楼303',
        requiredProctors: 2,
        currentProctors: 1,
        description: '大学物理期末考试，需要2名监考人员'
      },
      {
        id: '4',
        title: '2023年秋季学期期末考试',
        date: '2023-12-22',
        timeStart: '13:00',
        timeEnd: '15:00',
        location: '综合楼402',
        requiredProctors: 2,
        currentProctors: 0,
        description: '大学英语期末考试，需要2名监考人员'
      },
      {
        id: '5',
        title: 'CET-4英语等级考试',
        date: '2023-12-23',
        timeStart: '09:00',
        timeEnd: '11:30',
        location: '综合报告厅',
        requiredProctors: 10,
        currentProctors: 4,
        description: 'CET-4全国英语等级考试，需要10名监考人员，优先选择有经验的监考人员'
      }
    ];
    
    // 从本地存储加载已保存的任务
    const savedTasks = localStorage.getItem('exam-proctor-tasks');
    if (savedTasks) {
      try {
        setExamTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error('加载考试任务失败:', e);
        setExamTasks(defaultTasks);
        localStorage.setItem('exam-proctor-tasks', JSON.stringify(defaultTasks));
      }
    } else {
      setExamTasks(defaultTasks);
      localStorage.setItem('exam-proctor-tasks', JSON.stringify(defaultTasks));
    }
    
    // 从本地存储加载已保存的报名记录
    const savedRegistrations = localStorage.getItem('exam-proctor-registrations');
    if (savedRegistrations) {
      try {
        setRegistrations(JSON.parse(savedRegistrations));
      } catch (e) {
        console.error('加载报名记录失败:', e);
        setRegistrations([]);
      }
    }
  }, []);

  // 选择监考任务
  const handleSelectTask = (task: ExamTask) => {
    setSelectedTask(task);
    setSuccessMessage('');
    setErrorMessage('');
    
    // 重置表单数据
    setFormData({
      name: '',
      phone: '',
      email: '',
      agreement: false
    });
    
    // 重置表单错误
    setFormErrors({
      name: '',
      phone: '',
      email: '',
      agreement: ''
    });
    
    // 滚动到表单位置
    setTimeout(() => {
      const formElement = document.getElementById('registration-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // 清除对应的错误信息
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  // 验证表单数据
  const validateForm = () => {
    let valid = true;
    const newErrors = {
      name: '',
      phone: '',
      email: '',
      agreement: ''
    };
    
    // 验证姓名
    if (!formData.name.trim()) {
      newErrors.name = '请输入您的姓名';
      valid = false;
    }
    
    // 验证手机号
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = '请输入您的手机号';
      valid = false;
    } else if (!phoneRegex.test(formData.phone.trim())) {
      newErrors.phone = '请输入有效的手机号码';
      valid = false;
    }
    
    // 验证邮箱
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = '请输入您的邮箱';
      valid = false;
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = '请输入有效的邮箱地址';
      valid = false;
    }
    
    // 验证协议同意
    if (!formData.agreement) {
      newErrors.agreement = '请阅读并同意监考规定';
      valid = false;
    }
    
    setFormErrors(newErrors);
    return valid;
  };

  // 提交报名
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!validateForm()) {
      return;
    }
    
    // 检查是否已经报名过该任务
    const alreadyRegistered = registrations.some(
      reg => reg.taskId === selectedTask?.id && reg.email === formData.email
    );
    
    if (alreadyRegistered) {
      setErrorMessage('您已经报名过此监考任务，不能重复报名');
      return;
    }
    
    // 检查该任务的监考人员是否已满
    if (selectedTask && selectedTask.currentProctors >= selectedTask.requiredProctors) {
      setErrorMessage('很抱歉，此监考任务的名额已满');
      return;
    }
    
    // 创建新的报名记录
    const newRegistration: Registration = {
      taskId: selectedTask?.id || '',
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      timestamp: Date.now()
    };
    
    // 更新报名记录
    const updatedRegistrations = [...registrations, newRegistration];
    setRegistrations(updatedRegistrations);
    localStorage.setItem('exam-proctor-registrations', JSON.stringify(updatedRegistrations));
    
    // 更新任务的当前监考人数
    const updatedTasks = examTasks.map(task => {
      if (task.id === selectedTask?.id) {
        return {
          ...task,
          currentProctors: task.currentProctors + 1
        };
      }
      return task;
    });
    
    setExamTasks(updatedTasks);
    localStorage.setItem('exam-proctor-tasks', JSON.stringify(updatedTasks));
    
    // 更新选中的任务
    if (selectedTask) {
      setSelectedTask({
        ...selectedTask,
        currentProctors: selectedTask.currentProctors + 1
      });
    }
    
    // 显示成功消息
    setSuccessMessage('您已成功报名此监考任务！我们将通过短信和邮件通知您详细信息。');
    setErrorMessage('');
    
    // 重置表单
    setFormData({
      name: '',
      phone: '',
      email: '',
      agreement: false
    });
  };

  // 计算任务状态
  const getTaskStatus = (task: ExamTask) => {
    if (task.currentProctors >= task.requiredProctors) {
      return '已满';
    }
    if (task.currentProctors / task.requiredProctors >= 0.5) {
      return '招募中';
    }
    return '急需';
  };

  // 获取任务状态样式
  const getTaskStatusClass = (task: ExamTask) => {
    if (task.currentProctors >= task.requiredProctors) {
      return 'bg-gray-100 text-gray-600';
    }
    if (task.currentProctors / task.requiredProctors >= 0.5) {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-red-100 text-red-800';
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900">
            监考人员招募
          </h2>
          <p className="mt-3 text-xl text-gray-500">
            在线报名参与考试监考工作
          </p>
          <p className="mt-2 text-sm text-gray-500">
            监考人员将获得相应的工作补贴
          </p>
        </div>

        {/* 监考任务列表 */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-10">
          <div className="p-4 bg-gray-800 text-white">
            <h3 className="text-lg font-medium">可报名的监考任务</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {examTasks.map(task => (
              <div key={task.id} className="p-4 hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div className="mb-2 sm:mb-0">
                    <h4 className="text-lg font-medium text-gray-900">{task.title}</h4>
                    <div className="mt-1 text-sm text-gray-600">
                      <p>日期：{task.date}（{task.timeStart} - {task.timeEnd}）</p>
                      <p>地点：{task.location}</p>
                      <p>招募：{task.currentProctors}/{task.requiredProctors} 人</p>
                      <p className="text-gray-700">{task.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center mt-3 sm:mt-0">
                    <span className={`px-2 py-1 text-xs rounded-full mr-3 ${getTaskStatusClass(task)}`}>
                      {getTaskStatus(task)}
                    </span>
                    
                    <button
                      onClick={() => handleSelectTask(task)}
                      disabled={task.currentProctors >= task.requiredProctors}
                      className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
                        task.currentProctors >= task.requiredProctors
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {task.currentProctors >= task.requiredProctors ? '名额已满' : '立即报名'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {examTasks.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                当前没有可报名的监考任务
              </div>
            )}
          </div>
        </div>

        {/* 报名表单 */}
        {selectedTask && (
          <div id="registration-form" className="bg-white rounded-lg shadow-lg overflow-hidden mb-10">
            <div className="p-4 bg-blue-600 text-white">
              <h3 className="text-lg font-medium">监考任务报名</h3>
              <p className="text-sm text-blue-100 mt-1">{selectedTask.title} - {selectedTask.date}</p>
            </div>
            
            <div className="p-6">
              {/* 成功信息 */}
              {successMessage && (
                <div className="mb-6 p-4 rounded-md bg-green-50 text-green-800 border border-green-200">
                  <div className="flex">
                    <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <p>{successMessage}</p>
                  </div>
                </div>
              )}
              
              {/* 错误信息 */}
              {errorMessage && (
                <div className="mb-6 p-4 rounded-md bg-red-50 text-red-800 border border-red-200">
                  <div className="flex">
                    <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p>{errorMessage}</p>
                  </div>
                </div>
              )}
              
              {/* 报名表单 */}
              {!successMessage && (
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                      姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="请输入您的真实姓名"
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">
                      手机号码 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="请输入您的手机号码"
                    />
                    {formErrors.phone && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.phone}</p>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                      电子邮箱 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="请输入您的电子邮箱"
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>
                    )}
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          id="agreement"
                          name="agreement"
                          checked={formData.agreement}
                          onChange={handleInputChange}
                          className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                            formErrors.agreement ? 'border-red-500' : ''
                          }`}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="agreement" className="text-gray-700">
                          我已阅读并同意<span className="text-blue-600 hover:underline cursor-pointer">《监考人员工作规定》</span>
                        </label>
                        {formErrors.agreement && (
                          <p className="mt-1 text-sm text-red-500">{formErrors.agreement}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedTask(null)}
                      className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      提交报名
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
        
        {/* 数据说明 */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>所有数据仅存储在您的浏览器中，不会上传到服务器</p>
          <p>请确保提供的联系方式准确无误，以便我们与您联系</p>
        </div>
      </div>
    </div>
  );
} 