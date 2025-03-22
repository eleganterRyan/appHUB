/**
 * MeetingContext.backup.tsx
 * 检查点名称: 回退1号
 * 检查点日期: 2023-11-19
 * 
 * 这是会议调度器上下文的备份文件，用于在需要时回退代码
 * 主要功能:
 * 1. 用户数量限制 (最多5人)
 * 2. 实时通信与选择同步
 * 3. 用户状态管理
 * 4. 连接超时处理 (5秒)
 * 5. 一键重置功能
 * 6. 用户颜色区分
 */

'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// 用户颜色映射
const USER_COLORS = [
  { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', border: 'border-blue-600', text: 'text-blue-500' },
  { bg: 'bg-orange-500', hover: 'hover:bg-orange-600', border: 'border-orange-600', text: 'text-orange-500' },
  { bg: 'bg-pink-500', hover: 'hover:bg-pink-600', border: 'border-pink-600', text: 'text-pink-500' },
  { bg: 'bg-purple-500', hover: 'hover:bg-purple-600', border: 'border-purple-600', text: 'text-purple-500' },
  { bg: 'bg-amber-700', hover: 'hover:bg-amber-800', border: 'border-amber-800', text: 'text-amber-700' },
];

// 用户信息接口
interface UserInfo {
  id: string;
  colorIndex: number;
  selections: Record<string, boolean>;
}

// 定义上下文类型
type MeetingContextType = {
  userId: string;
  selectedTimes: Record<string, boolean>;
  commonTimes: Record<string, boolean>;
  userCount: number;
  userColorClasses: { bg: string, hover: string, border: string, text: string };
  userColorIndex: number;
  allUserInfo: Record<string, UserInfo>;
  selectTime: (timeSlot: string) => void;
  unselectTime: (timeSlot: string) => void;
  resetAllSelections: () => void;
  getOnlineUsers: () => number;
};

// 创建上下文
const MeetingContext = createContext<MeetingContextType | null>(null);

// 创建一个广播频道用于用户间通信
let broadcastChannel: BroadcastChannel | null = null;

// 提供者组件
export const MeetingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId] = useState<string>(uuidv4());
  const [selectedTimes, setSelectedTimes] = useState<Record<string, boolean>>({});
  const [allUserSelections, setAllUserSelections] = useState<Record<string, Record<string, boolean>>>({});
  const [allUserInfo, setAllUserInfo] = useState<Record<string, UserInfo>>({});
  const [commonTimes, setCommonTimes] = useState<Record<string, boolean>>({});
  const [userCount, setUserCount] = useState<number>(0);
  const [isUserAllowed, setIsUserAllowed] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userColorIndex, setUserColorIndex] = useState<number>(0);

  // 获取当前用户的颜色类
  const userColorClasses = USER_COLORS[userColorIndex];

  // 初始化广播频道
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // 创建广播频道
        broadcastChannel = new BroadcastChannel('meeting-scheduler');
        
        // 设置连接超时计时器 - 5秒后如果还没收到响应，自动允许用户
        const connectionTimeout = setTimeout(() => {
          if (isLoading) {
            console.log('连接超时，自动允许用户');
            setIsLoading(false);
            setIsUserAllowed(true);
            setUserColorIndex(0); // 默认使用第一个颜色
            
            // 初始化自身用户信息
            setAllUserInfo({
              [userId]: {
                id: userId,
                colorIndex: 0,
                selections: {}
              }
            });
            
            // 将用户添加到本地存储
            localStorage.setItem(`meeting-user-${userId}`, JSON.stringify({
              connected: true,
              timestamp: Date.now(),
              colorIndex: 0
            }));
            
            // 广播用户加入消息
            if (broadcastChannel) {
              broadcastChannel.postMessage({
                type: 'USER_JOINED',
                userId,
                selectedTimes: {},
                colorIndex: 0
              });
            }
          }
        }, 5000);
        
        // 请求更新用户数量
        broadcastChannel.postMessage({ 
          type: 'REQUEST_USER_COUNT',
          userId 
        });
        
        // 监听消息
        broadcastChannel.onmessage = (event) => {
          const { type, userId: senderId, selectedTimes: senderTimes, colorIndex: senderColorIndex, allUsers, allowedUsers } = event.data;
          
          if (type === 'USER_COUNT_RESPONSE' && allowedUsers && Array.isArray(allowedUsers)) {
            // 收到响应，清除超时计时器
            clearTimeout(connectionTimeout);
            
            // 检查当前用户是否在允许的用户列表中
            const isAllowed = allowedUsers.includes(userId) || allowedUsers.length < 5;
            setIsUserAllowed(isAllowed);
            setUserCount(allUsers);
            setIsLoading(false);
            
            // 如果用户被允许，发送加入消息
            if (isAllowed) {
              // 分配颜色索引（使用用户在allowedUsers中的位置）
              const userPosition = allowedUsers.indexOf(userId);
              const colorIdx = userPosition >= 0 ? userPosition % USER_COLORS.length : allowedUsers.length % USER_COLORS.length;
              setUserColorIndex(colorIdx);
              
              // 初始化自身用户信息
              setAllUserInfo(prev => ({
                ...prev,
                [userId]: {
                  id: userId,
                  colorIndex: colorIdx,
                  selections: {}
                }
              }));
              
              broadcastChannel?.postMessage({
                type: 'USER_JOINED',
                userId,
                selectedTimes: {},
                colorIndex: colorIdx
              });
              
              // 更新自身信息为已连接状态
              localStorage.setItem(`meeting-user-${userId}`, JSON.stringify({
                connected: true,
                timestamp: Date.now(),
                colorIndex: colorIdx
              }));
            }
          }
          else if (type === 'USER_JOINED' && senderId !== userId) {
            // 更新用户信息
            setAllUserInfo(prev => ({
              ...prev,
              [senderId]: {
                id: senderId,
                colorIndex: senderColorIndex !== undefined ? senderColorIndex : 0,
                selections: senderTimes || {}
              }
            }));
            
            // 向新用户发送当前用户的选择
            broadcastChannel?.postMessage({
              type: 'CURRENT_SELECTION',
              userId,
              selectedTimes,
              colorIndex: userColorIndex
            });
          } 
          else if (type === 'CURRENT_SELECTION' && senderId !== userId) {
            // 更新其他用户的选择
            setAllUserSelections(prev => ({
              ...prev,
              [senderId]: senderTimes
            }));
            
            // 更新用户信息
            setAllUserInfo(prev => ({
              ...prev,
              [senderId]: {
                id: senderId,
                colorIndex: senderColorIndex !== undefined ? senderColorIndex : 0,
                selections: senderTimes || {}
              }
            }));
          }
          else if (type === 'TIME_SELECTED' && senderId !== userId) {
            // 更新特定用户的时间选择
            setAllUserSelections(prev => ({
              ...prev,
              [senderId]: senderTimes
            }));
            
            // 更新用户信息
            setAllUserInfo(prev => {
              if (prev[senderId]) {
                return {
                  ...prev,
                  [senderId]: {
                    ...prev[senderId],
                    selections: senderTimes || {}
                  }
                };
              }
              return prev;
            });
          }
          else if (type === 'USER_LEFT' && senderId !== userId) {
            // 用户离开，移除其选择
            setAllUserSelections(prev => {
              const newSelections = { ...prev };
              delete newSelections[senderId];
              return newSelections;
            });
            
            // 移除用户信息
            setAllUserInfo(prev => {
              const newInfo = { ...prev };
              delete newInfo[senderId];
              return newInfo;
            });
          }
          else if (type === 'USER_COUNT') {
            setUserCount(allUsers);
          }
          else if (type === 'REQUEST_USER_COUNT') {
            // 响应用户数量请求
            const activeUsers = checkUserCount();
            
            // 获取活跃用户ID列表
            const activeUserIds = getAllActiveUserIds();
            
            // 发送用户数量响应，包含允许的用户ID列表
            broadcastChannel?.postMessage({
              type: 'USER_COUNT_RESPONSE',
              allUsers: activeUsers,
              allowedUsers: activeUserIds.slice(0, 5), // 只允许前5个用户
              requesterId: senderId
            });
          }
        };

        // 页面卸载前通知其他用户
        window.addEventListener('beforeunload', handleBeforeUnload);

        // 定期检查用户计数
        const interval = setInterval(checkUserCount, 5000);
        
        return () => {
          clearTimeout(connectionTimeout);
          clearInterval(interval);
          handleBeforeUnload();
          window.removeEventListener('beforeunload', handleBeforeUnload);
          if (broadcastChannel) {
            broadcastChannel.close();
          }
        };
      } catch (error) {
        console.error('初始化通信渠道失败:', error);
        setIsLoading(false);
        setIsUserAllowed(true); // 出错时默认允许用户
        
        // 将用户添加到本地存储
        localStorage.setItem(`meeting-user-${userId}`, JSON.stringify({
          connected: true,
          timestamp: Date.now(),
          colorIndex: 0
        }));
        
        // 初始化自身用户信息
        setAllUserInfo({
          [userId]: {
            id: userId,
            colorIndex: 0,
            selections: {}
          }
        });
      }
    }
  }, [userId, isLoading, userColorIndex]);

  // 获取所有活跃用户ID
  const getAllActiveUserIds = () => {
    const now = Date.now();
    const userIds: string[] = [];

    // 遍历localStorage查找活跃用户
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('meeting-user-')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          // 如果用户在5分钟内有活动
          if (data.connected && now - data.timestamp < 5 * 60 * 1000) {
            userIds.push(key.replace('meeting-user-', ''));
          } else {
            // 清除不活跃的用户
            localStorage.removeItem(key);
          }
        } catch (e) {
          localStorage.removeItem(key);
        }
      }
    }
    
    return userIds;
  };

  // 监听所有用户的选择，计算共同时间
  useEffect(() => {
    // 将当前用户的选择添加到所有选择中
    const allSelections = {
      ...allUserSelections,
      [userId]: selectedTimes
    };
    
    // 更新自身用户信息
    setAllUserInfo(prev => ({
      ...prev,
      [userId]: {
        id: userId,
        colorIndex: userColorIndex,
        selections: selectedTimes
      }
    }));
    
    // 如果没有用户或只有一个用户，则没有共同时间
    if (Object.keys(allSelections).length <= 1) {
      setCommonTimes({});
      return;
    }
    
    // 计算共同时间
    const userIds = Object.keys(allSelections);
    const timeSlots = new Set<string>();
    
    // 收集所有时间槽
    userIds.forEach(id => {
      Object.keys(allSelections[id] || {}).forEach(timeSlot => {
        if (allSelections[id][timeSlot]) {
          timeSlots.add(timeSlot);
        }
      });
    });
    
    // 计算每个时间槽的选择用户数
    const newCommonTimes: Record<string, boolean> = {};
    timeSlots.forEach(timeSlot => {
      let count = 0;
      userIds.forEach(id => {
        if (allSelections[id][timeSlot]) {
          count++;
        }
      });
      
      // 如果所有用户都选择了这个时间槽，则它是共同时间
      newCommonTimes[timeSlot] = count === userIds.length;
    });
    
    setCommonTimes(newCommonTimes);
  }, [selectedTimes, allUserSelections, userId, userColorIndex]);

  // 处理页面卸载
  const handleBeforeUnload = () => {
    if (broadcastChannel) {
      broadcastChannel.postMessage({
        type: 'USER_LEFT',
        userId,
      });
    }
    localStorage.removeItem(`meeting-user-${userId}`);
  };

  // 检查和更新用户计数
  const checkUserCount = () => {
    const userIds = getAllActiveUserIds();
    
    // 限制最多5个用户
    const activeUsers = Math.min(userIds.length, 5);
    
    // 广播用户数量
    if (broadcastChannel) {
      broadcastChannel.postMessage({
        type: 'USER_COUNT',
        allUsers: activeUsers
      });
    }
    
    setUserCount(activeUsers);
    
    // 如果当前用户在允许的名单中，则更新时间戳
    if (userIds.indexOf(userId) < 5) {
      localStorage.setItem(`meeting-user-${userId}`, JSON.stringify({
        connected: true,
        timestamp: Date.now(),
        colorIndex: userColorIndex
      }));
    }
    
    return activeUsers;
  };
  
  // 获取当前在线用户数量
  const getOnlineUsers = () => {
    return userCount;
  };

  // 选择时间
  const selectTime = (timeSlot: string) => {
    // 如果用户不被允许，则不进行任何操作
    if (!isUserAllowed) return;
    
    setSelectedTimes(prev => {
      const newSelection = { ...prev, [timeSlot]: true };
      
      // 广播时间选择
      if (broadcastChannel) {
        broadcastChannel.postMessage({
          type: 'TIME_SELECTED',
          userId,
          selectedTimes: newSelection,
          colorIndex: userColorIndex
        });
      }
      
      return newSelection;
    });
  };

  // 取消选择时间
  const unselectTime = (timeSlot: string) => {
    // 如果用户不被允许，则不进行任何操作
    if (!isUserAllowed) return;
    
    setSelectedTimes(prev => {
      const newSelection = { ...prev };
      delete newSelection[timeSlot];
      
      // 广播时间选择更新
      if (broadcastChannel) {
        broadcastChannel.postMessage({
          type: 'TIME_SELECTED',
          userId,
          selectedTimes: newSelection,
          colorIndex: userColorIndex
        });
      }
      
      return newSelection;
    });
  };

  // 添加一个重置所有选择的函数
  const resetAllSelections = () => {
    // 如果用户不被允许，则不进行任何操作
    if (!isUserAllowed) return;
    
    // 清空所有选择
    setSelectedTimes({});
    
    // 广播清空选择
    if (broadcastChannel) {
      broadcastChannel.postMessage({
        type: 'TIME_SELECTED',
        userId,
        selectedTimes: {},
        colorIndex: userColorIndex
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-lg text-gray-700">正在连接...</p>
      </div>
    );
  }

  if (!isUserAllowed) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-300 text-center">
        <h3 className="text-xl font-bold text-red-700 mb-3">无法加入会议</h3>
        <p className="text-red-600 mb-4">已达到最大用户数量限制（5人）。请稍后再试或联系会议发起人。</p>
        <p className="text-gray-600">当前在线用户: {userCount}/5</p>
      </div>
    );
  }

  return (
    <MeetingContext.Provider
      value={{
        userId,
        selectedTimes,
        commonTimes,
        userCount,
        userColorClasses,
        userColorIndex,
        allUserInfo,
        selectTime,
        unselectTime,
        resetAllSelections,
        getOnlineUsers,
      }}
    >
      {children}
    </MeetingContext.Provider>
  );
};

// 自定义hook，用于在组件中使用上下文
export const useMeeting = () => {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error('useMeeting must be used within a MeetingProvider');
  }
  return context;
}; 