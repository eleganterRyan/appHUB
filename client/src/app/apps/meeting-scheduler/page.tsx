'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { format, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast'

// 定义时间块接口
interface TimeBlock {
  day: number; // 0-6，代表周一到周日
  hour: number; // 8-22，代表8:00-22:00
  selected: boolean; // 是否被当前用户选择
  overlapped: boolean; // 是否被多个用户选择
}

// 定义用户选择
interface UserSelection {
  userId: string;
  blocks: string[]; // 格式为 "day_hour"
}

// 连接用户接口
interface ConnectedUser {
  id: string;
  name: string;
  color: string;
  lastActive: number;
}

// 定义选择状态
interface SelectionState {
  startBlock: string | null;
  endBlock: string | null;
  isSelecting: boolean;
  selectMode: boolean | null; // true为选择模式，false为取消选择模式
}

// 周日名称
const WEEKDAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

// 用户颜色列表
const USER_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-purple-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-teal-500'
];

export default function MeetingScheduler() {
  // 时间块和选择状态
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [selectionState, setSelectionState] = useState<SelectionState>({
    startBlock: null,
    endBlock: null,
    isSelecting: false,
    selectMode: null
  });
  
  // 用户相关状态
  const [userId, setUserId] = useState<string>(Math.random().toString(36).substring(2, 9));
  const [userName, setUserName] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<ConnectedUser | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [allUserSelections, setAllUserSelections] = useState<UserSelection[]>([]);
  
  // 日期和周视图
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  
  // WebSocket引用
  const wsRef = useRef<WebSocket | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // 连接WebSocket服务器
  useEffect(() => {
    // 防止重复执行
    if (isMountedRef.current) return;
    isMountedRef.current = true;
    
    // 生成随机用户ID和颜色
    const generatedUserId = Math.random().toString(36).substring(2, 10);
    const randomColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;
    setUserId(generatedUserId);

    // 创建WebSocket连接
    // 注意：在实际部署时，需要更换为实际的WebSocket服务器地址
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://${window.location.hostname}:5000/ws/meeting`;
    const ws = new WebSocket(socketUrl);
    wsRef.current = ws;

    // 连接建立时
    ws.onopen = () => {
      console.log('WebSocket连接已建立');
      // 发送加入消息
      ws.send(JSON.stringify({
        type: 'join',
        userId: generatedUserId,
        color: randomColor
      }));
    };

    // 接收消息
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // 处理不同类型的消息
        switch (data.type) {
          case 'users':
            // 更新连接的用户列表
            setConnectedUsers(data.users);
            break;
          case 'selections':
            // 更新其他用户的选择
            setAllUserSelections(data.selections);
            // 更新重叠时间段
            updateOverlappedBlocks(data.selections);
            break;
          default:
            console.log('未知消息类型:', data.type);
        }
      } catch (error) {
        console.error('解析消息失败:', error);
      }
    };

    // 连接关闭时
    ws.onclose = () => {
      console.log('WebSocket连接已关闭');
    };

    // 发生错误时
    ws.onerror = (error) => {
      console.error('WebSocket错误:', error);
      
      // 如果WebSocket无法连接，使用模拟数据（开发环境）
      if (process.env.NODE_ENV === 'development') {
        console.log('使用模拟数据');
        simulateFakeUsers(generatedUserId, randomColor);
      }
    };

    // 组件卸载时关闭WebSocket连接
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'leave',
          userId: generatedUserId
        }));
        ws.close();
      }
    };
  }, []);

  // 如果WebSocket无法连接，使用模拟数据
  const simulateFakeUsers = (currentUserId: string, currentUserColor: string) => {
    // 模拟连接的用户
    const mockUsers: ConnectedUser[] = [
      { id: currentUserId, name: '', color: currentUserColor, lastActive: Date.now() }
    ];
    
    // 添加1-4个模拟用户
    const userCount = Math.floor(Math.random() * 4) + 1;
    for (let i = 0; i < userCount; i++) {
      mockUsers.push({
        id: Math.random().toString(36).substring(2, 10),
        name: '',
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        lastActive: Date.now()
      });
    }
    
    setConnectedUsers(mockUsers);
    
    // 模拟其他用户的选择
    setTimeout(() => {
      const mockSelections: UserSelection[] = [];
      
      // 为当前用户添加一个空的选择
      mockSelections.push({
        userId: currentUserId,
        blocks: []
      });
      
      // 为其他用户生成随机选择
      mockUsers.forEach(user => {
        if (user.id !== currentUserId) {
          const randomBlocks: string[] = [];
          
          // 随机选择1-5个连续时间块
          const randomDay = Math.floor(Math.random() * 7);
          const randomStartHour = Math.floor(Math.random() * 12) + 8; // 8-20之间
          const randomBlockCount = Math.floor(Math.random() * 5) + 1; // 1-5个连续块
          
          for (let i = 0; i < randomBlockCount; i++) {
            if (randomStartHour + i < 22) {
              randomBlocks.push(`${randomDay}_${randomStartHour + i}`);
            }
          }
          
          mockSelections.push({
            userId: user.id,
            blocks: randomBlocks
          });
        }
      });
      
      setAllUserSelections(mockSelections);
      updateOverlappedBlocks(mockSelections);
    }, 1000);
  };

  // 初始化时间块和周视图
  useEffect(() => {
    console.log('初始化周视图和时间块, currentDate = ', currentDate);
    initWeekDays();
    initTimeBlocks();
  }, [currentDate]);

  // 初始化周视图 - 从周一开始
  const initWeekDays = () => {
    const days = [];
    const curr = new Date(currentDate);
    
    // 获取当前周的周一
    // getDay()返回0-6，代表周日到周六
    // 将0(周日)视为7，然后计算到周一的差值
    const currentDayOfWeek = curr.getDay();
    const daysSinceMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - daysSinceMonday);
    
    // 生成从周一开始的一周
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      days.push(day);
    }
    
    console.log('设置周视图, 从', days[0].toLocaleDateString(), '到', days[6].toLocaleDateString());
    setWeekDays(days);
  };

  // 初始化时间块
  const initTimeBlocks = () => {
    // 创建一个全新的数组
    const blocks: TimeBlock[] = [];
    
    // 为每一天和每个小时创建时间块
    for (let day = 0; day < 7; day++) {
      for (let hour = 8; hour < 22; hour++) {
        blocks.push({
          day,
          hour,
          selected: false,
          overlapped: false
        });
      }
    }
    
    console.log(`初始化了 ${blocks.length} 个时间块`);
    setTimeBlocks(blocks);
  };

  // 更新前一周
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  // 更新后一周
  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  // 返回当天
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 获取时间块的键值
  const getBlockKey = (day: number, hour: number): string => {
    return `${day}_${hour}`;
  };
  
  // 解析时间块键值
  const parseBlockKey = (key: string): { day: number, hour: number } => {
    const [day, hour] = key.split('_').map(Number);
    return { day, hour };
  };

  // 更新选择状态的辅助函数
  const setSelectedState = (blocks: TimeBlock[], day: number, hour: number, selected: boolean) => {
    const index = blocks.findIndex(b => b.day === day && b.hour === hour);
    if (index !== -1) {
      blocks[index] = { ...blocks[index], selected };
      return true;
    }
    return false;
  };

  // 获取时间块索引
  const getBlockIndex = (day: number, hour: number): number => {
    return timeBlocks.findIndex(b => b.day === day && b.hour === hour);
  };

  // 处理鼠标按下事件 - 开始选择
  const handleMouseDown = (day: number, hour: number, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // 防止默认行为
    e.stopPropagation(); // 阻止事件冒泡
    
    // 确保只响应鼠标左键或触摸事件
    if ('button' in e && e.button !== 0) return;
    
    console.log(`选择开始: day=${day}, hour=${hour}`);
    
    // 先检查timeBlocks是否已初始化
    if (timeBlocks.length === 0) {
      console.error('时间块数组为空');
      return;
    }
    
    // 获取当前块的状态
    const blockIndex = getBlockIndex(day, hour);
    
    if (blockIndex === -1) {
      console.error(`未找到时间块: day=${day}, hour=${hour}`);
      return;
    }
    
    // 获取当前块的选择状态
    const currentSelected = timeBlocks[blockIndex].selected;
    
    // 设置选择模式 - 如果当前块已选择，则为取消选择模式；否则为选择模式
    const newSelectMode = !currentSelected;
    console.log(`选择模式: ${newSelectMode ? '选择' : '取消选择'}`);
    
    // 创建新的时间块数组
    const newBlocks = [...timeBlocks];
    
    // 立即更新当前块的选择状态
    setSelectedState(newBlocks, day, hour, newSelectMode);
    
    // 更新状态
    setTimeBlocks(newBlocks);
    
    // 设置选择状态
    const blockKey = getBlockKey(day, hour);
    setSelectionState({
      startBlock: blockKey,
      endBlock: blockKey,
      isSelecting: true,
      selectMode: newSelectMode
    });
  };

  // 处理鼠标移动事件 - 更新选择范围
  const handleMouseEnter = (day: number, hour: number, e: React.MouseEvent | React.TouchEvent) => {
    // 如果不在选择状态，则退出
    if (!selectionState.isSelecting || selectionState.selectMode === null || !selectionState.startBlock) return;
    
    // 防止文本选择
    e.preventDefault();
    
    // 设置结束块
    const blockKey = getBlockKey(day, hour);
    
    // 如果结束块没有变化，则退出
    if (blockKey === selectionState.endBlock) return;
    
    // 更新选择状态
    setSelectionState(prev => ({
      ...prev,
      endBlock: blockKey
    }));
    
    // 更新选择范围
    const { day: startDay, hour: startHour } = parseBlockKey(selectionState.startBlock);
    updateSelectionRange(startDay, startHour, day, hour, selectionState.selectMode);
  };

  // 处理鼠标抬起事件 - 结束选择
  const handleMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
    // 如果不在选择状态，则退出
    if (!selectionState.isSelecting) return;
    
    // 防止文本选择
    e.preventDefault();
    
    console.log('结束选择');
    
    // 完成选择，重置选择状态
    setSelectionState({
      startBlock: null,
      endBlock: null,
      isSelecting: false,
      selectMode: null
    });
    
    // 更新用户选择列表并发送更新
    updateUserSelections();
  };

  // 处理鼠标离开事件 - 可选择结束选择
  const handleMouseLeave = (e: React.MouseEvent) => {
    // 如果鼠标离开了选择区域，结束选择
    if (selectionState.isSelecting) {
      handleMouseUp(e);
    }
  };

  // 更新选择范围 - 优化版本
  const updateSelectionRange = (startDay: number, startHour: number, endDay: number, endHour: number, selectMode: boolean) => {
    // 确定选择的范围
    const minDay = Math.min(startDay, endDay);
    const maxDay = Math.max(startDay, endDay);
    const minHour = Math.min(startHour, endHour);
    const maxHour = Math.max(startHour, endHour);
    
    console.log(`更新选择范围: 从(${minDay},${minHour})到(${maxDay},${maxHour}), 模式=${selectMode}`);
    
    // 创建新的时间块数组
    const newBlocks = [...timeBlocks];
    let updated = false;
    
    // 遍历所有块，更新在范围内的块
    for (let i = 0; i < newBlocks.length; i++) {
      const block = newBlocks[i];
      
      if (block.day >= minDay && block.day <= maxDay && block.hour >= minHour && block.hour <= maxHour) {
        if (block.selected !== selectMode) {
          newBlocks[i] = { ...block, selected: selectMode };
          updated = true;
        }
      }
    }
    
    // 只有在有实际更新时才设置状态
    if (updated) {
      setTimeBlocks(newBlocks);
    }
  };

  // 更新用户选择列表并发送更新
  const updateUserSelections = () => {
    // 获取当前选择的块
    const selectedBlocks = timeBlocks
      .filter(block => block.selected)
      .map(block => getBlockKey(block.day, block.hour));
    
    // 更新用户选择列表
    const userIndex = allUserSelections.findIndex(user => user.userId === userId);
    
    let updatedSelections = [...allUserSelections];
    
    if (userIndex !== -1) {
      updatedSelections[userIndex] = {
        userId,
        blocks: selectedBlocks
      };
    } else {
      updatedSelections = [
        ...updatedSelections,
        {
          userId,
          blocks: selectedBlocks
        }
      ];
    }
    
    // 更新状态
    setAllUserSelections(updatedSelections);
    
    // 更新重叠的块
    updateOverlappedBlocks(updatedSelections);
    
    // 向服务器发送更新
    console.log('向服务器发送更新', { userId, blocks: selectedBlocks });
  };

  // 添加全局鼠标移动处理
  useEffect(() => {
    // 全局鼠标移出和鼠标抬起处理
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (selectionState.isSelecting) {
        // 防止文本选择
        e.preventDefault();
        
        // 结束选择
        setSelectionState({
          startBlock: null,
          endBlock: null,
          isSelecting: false,
          selectMode: null
        });
        
        // 确保保存选择结果
        updateUserSelections();
      }
    };
    
    // 添加全局事件监听
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp as any);
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp as any);
    };
  }, [selectionState.isSelecting]);
  
  // 优化用户提交按钮 
  const handleUserNameSubmit = () => {
    if (userName.trim()) {
      // 更新当前用户ID和名称
      const newUserId = Math.random().toString(36).substring(2, 9);
      setUserId(newUserId);
      
      // 创建新的用户对象
      const newUser: ConnectedUser = {
        id: newUserId,
        name: userName.trim(),
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        lastActive: Date.now()
      };
      
      // 更新当前用户
      setCurrentUser(newUser);
      
      // 添加到连接用户列表
      setConnectedUsers(prev => [
        ...prev.filter(u => u.id !== newUserId),
        newUser
      ]);
      
      // 清理选择状态
      setTimeBlocks(prev => prev.map(block => ({
        ...block,
        selected: false
      })));
      
      // 提示用户可以开始选择
      toast.success(`欢迎, ${userName.trim()}! 请选择您可参加会议的时间`);
    } else {
      toast.error('请输入您的名字');
    }
  };

  // 更新用户间重叠的时间段
  const updateOverlappedBlocks = (selections: UserSelection[]) => {
    // 获取当前所有用户的选择
    const allSelections = selections || allUserSelections;
    
    if (allSelections.length === 0) return;
    
    // 计算重叠的时间块
    const blockCountMap: Record<string, number> = {};
    
    allSelections.forEach(user => {
      user.blocks.forEach(block => {
        if (blockCountMap[block]) {
          blockCountMap[block]++;
        } else {
          blockCountMap[block] = 1;
        }
      });
    });
    
    // 更新时间块的重叠状态
    const updatedBlocks = [...timeBlocks];
    const activeUserCount = connectedUsers.length;
    
    updatedBlocks.forEach(block => {
      const blockKey = getBlockKey(block.day, block.hour);
      const count = blockCountMap[blockKey] || 0;
      
      // 如果所有用户都选择了这个时间块，标记为重叠
      block.overlapped = count === activeUserCount && count > 0;
    });
    
    setTimeBlocks(updatedBlocks);
  };

  // 获取样式类
  const getBlockStyle = (block: TimeBlock) => {
    let baseClass = 
      'relative h-12 border border-gray-300 text-center cursor-pointer transition-colors duration-150';
    
    // 添加活跃状态样式
    if (selectionState.isSelecting) {
      baseClass += ' select-none';
    }
    
    // 根据选择和重叠状态设置不同的样式
    if (block.selected) {
      if (block.overlapped) {
        return `${baseClass} bg-green-200 hover:bg-green-300`;
      } else {
        return `${baseClass} bg-blue-200 hover:bg-blue-300`;
      }
    } else {
      return `${baseClass} bg-white hover:bg-gray-100`;
    }
  };

  // 格式化日期显示
  const formatDate = (date: Date): string => {
    return format(date, 'MM月dd日', { locale: zhCN });
  };

  // 获取周几名称
  const getDayOfWeek = (date: Date): string => {
    const day = date.getDay();
    return WEEKDAY_NAMES[day === 0 ? 6 : day - 1]; // 调整为周一为0，周日为6
  };

  // 格式化时间显示
  const formatHourRange = (hour: number) => {
    return `${hour}-${hour + 1}点`;
  };

  // 检测是否为今天
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // 渲染单个时间块 - 添加触摸事件支持
  const renderTimeBlock = (dayIndex: number, hour: number) => {
    // 查找对应的时间块
    const block = timeBlocks.find(b => b.day === dayIndex && b.hour === hour);
    
    // 如果找不到块，使用默认值
    const blockData = block || { day: dayIndex, hour, selected: false, overlapped: false };
    
    return (
      <div
        key={`block-${dayIndex}-${hour}`}
        className={getBlockStyle(blockData)}
        onMouseDown={(e) => handleMouseDown(dayIndex, hour, e)}
        onMouseEnter={(e) => handleMouseEnter(dayIndex, hour, e)}
        onMouseUp={handleMouseUp}
        onTouchStart={(e) => handleMouseDown(dayIndex, hour, e)}
        onTouchMove={(e) => {
          // 触摸移动时，获取触摸点下方的元素
          const touch = e.touches[0];
          const element = document.elementFromPoint(touch.clientX, touch.clientY);
          
          if (element) {
            const day = Number(element.getAttribute('data-day'));
            const hour = Number(element.getAttribute('data-hour'));
            
            if (!isNaN(day) && !isNaN(hour)) {
              handleMouseEnter(day, hour, e);
            }
          }
        }}
        onTouchEnd={handleMouseUp}
        data-day={dayIndex}
        data-hour={hour}
        data-selected={blockData.selected ? 'true' : 'false'}
      >
        {blockData.overlapped && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-green-800 text-xs font-medium">共同可用</span>
          </div>
        )}
      </div>
    );
  };

  // 添加测试按钮上的加载状态
  const [isTestLoading, setIsTestLoading] = useState(false);
  
  // 测试时间块选择
  const testTimeBlockSelection = () => {
    console.log('执行时间块选择测试');
    setIsTestLoading(true);
    
    try {
      // 检查时间块是否已初始化
      if (timeBlocks.length === 0) {
        console.error('时间块数组为空，无法进行测试');
        alert('时间块未初始化，请刷新页面再试');
        return;
      }
      
      // 创建新的时间块数组
      const newBlocks = [...timeBlocks];
      let updated = false;
      
      // 尝试选择周一 10点到12点的时间段
      for (let hour = 10; hour <= 12; hour++) {
        const index = newBlocks.findIndex(b => b.day === 0 && b.hour === hour);
        if (index !== -1) {
          newBlocks[index] = { ...newBlocks[index], selected: true };
          updated = true;
        }
      }
      
      if (updated) {
        // 更新状态
        setTimeBlocks(newBlocks);
        
        // 延迟更新用户选择，以便UI先更新
        setTimeout(() => {
          updateUserSelections();
          console.log('测试成功：已选择周一 10点到12点');
          alert('测试成功：已选择周一 10点到12点');
          setIsTestLoading(false);
        }, 100);
      } else {
        console.error('测试失败：未找到要选择的时间块');
        alert('测试失败：未找到要选择的时间块');
        setIsTestLoading(false);
      }
    } catch (error) {
      console.error('测试出错:', error);
      alert('测试出错，请查看控制台');
      setIsTestLoading(false);
    }
  };

  // 在界面中添加测试按钮
  const TestButton = () => (
    <button
      onClick={testTimeBlockSelection}
      disabled={isTestLoading}
      className={`fixed bottom-4 right-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors z-50 ${isTestLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title="测试时间块选择功能"
    >
      {isTestLoading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          测试中...
        </span>
      ) : '测试选择'}
    </button>
  );

  return (
    <>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <div className="relative">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">会议时间确认</h1>
          
          <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
            {!currentUser ? (
              // 用户名输入表单
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-gray-700 font-medium">请输入您的名字:</label>
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="您的名字"
                    onKeyDown={(e) => e.key === 'Enter' && handleUserNameSubmit()}
                  />
                  <button
                    onClick={handleUserNameSubmit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!userName.trim()}
                  >
                    <span className="flex items-center justify-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      确认
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              // 当前用户信息和参与者列表
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                  <div className="flex items-center gap-2 mb-2 sm:mb-0">
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: currentUser.color }}></div>
                    <span className="font-medium">欢迎, {currentUser.name}!</span>
                    <span className="text-sm text-gray-500">请选择您可参加会议的时间段</span>
                  </div>
                  <button 
                    onClick={() => setCurrentUser(null)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    切换用户
                  </button>
                </div>
                
                <div className="mt-2">
                  <p className="text-sm text-gray-700 mb-2">参与者 ({connectedUsers.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {connectedUsers.map((user, index) => (
                      <div key={user.id} className="flex items-center bg-gray-100 px-3 py-1.5 rounded-lg">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: user.color }}></div>
                        <span className="text-sm">{user.name || `用户 ${index + 1}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 mb-6 bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm text-blue-800">
            <div className="flex items-start">
              <svg className="h-5 w-5 mr-2 mt-0.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium mb-1">如何使用:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>点击或拖动时间块以选择您可参加会议的时间</li>
                  <li>绿色区域表示所有参与者都可以参加的时间</li>
                  <li>您可以随时更新您的选择</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="relative overflow-x-auto shadow-md rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 w-24">时间/日期</th>
                  {weekDays.map((day, index) => (
                    <th key={index} className="p-4 w-1/5">
                      {formatDate(day)} ({getDayOfWeek(day)})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 14 }, (_, i) => i + 8).map(hour => (
                  <tr key={hour} className={hour % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-4 font-medium text-center">
                      {hour}-{hour + 1}点
                    </td>
                    {Array.from({ length: 5 }, (_, dayIndex) => (
                      renderTimeBlock(dayIndex, hour)
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* 测试按钮 */}
        <TestButton />
      </div>
    </>
  )
} 