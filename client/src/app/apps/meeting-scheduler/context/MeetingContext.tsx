/**
 * MeetingContext.tsx
 * 检查点名称: 回退1号
 * 检查点日期: 2023-11-19
 * 
 * 会议调度器上下文组件
 * 主要功能:
 * 1. 用户数量限制 (最多5人)
 * 2. 实时通信与选择同步
 * 3. 用户状态管理
 * 4. 连接超时处理 (5秒)
 * 5. 一键重置功能
 * 6. 用户颜色区分
 * 7. 跨设备实时通信 (WebSocket)
 * 
 * 备份文件: MeetingContext.backup.tsx (相同日期)
 */

'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { io, Socket } from 'socket.io-client';

// WebSocket服务器地址
// 注意：在生产环境中应该使用环境变量配置
const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:3001';
console.log('WebSocket服务器地址:', SOCKET_SERVER_URL);

// 用户颜色映射
const USER_COLORS = [
  { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', border: 'border-blue-600', text: 'text-blue-500' },
  { bg: 'bg-orange-500', hover: 'hover:bg-orange-600', border: 'border-orange-600', text: 'text-orange-500' },
  { bg: 'bg-pink-500', hover: 'hover:bg-pink-600', border: 'border-pink-600', text: 'text-pink-500' },
  { bg: 'bg-purple-500', hover: 'hover:bg-purple-600', border: 'border-purple-600', text: 'text-purple-500' },
  { bg: 'bg-amber-700', hover: 'hover:bg-amber-800', border: 'border-amber-800', text: 'text-amber-700' },
];

// 用户颜色存储键
const USER_COLOR_INDEX_KEY = 'meeting-scheduler-user-colors';
// 用户选择存储键
const USER_SELECTIONS_KEY = 'meeting-scheduler-selections';

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

// 创建一个Socket.io连接用于用户间跨设备通信
let socket: Socket | null = null;

// 提供者组件
export const MeetingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 使用会话存储确保刷新页面时用户ID保持不变
  const getOrCreateUserId = () => {
    // 首先尝试从sessionStorage获取用户ID
    const storedId = sessionStorage.getItem('meeting-user-id');
    if (storedId) return storedId;
    
    // 如果没有，创建新ID并存储
    const newId = uuidv4();
    sessionStorage.setItem('meeting-user-id', newId);
    return newId;
  };

  const [userId] = useState<string>(getOrCreateUserId());
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

  // 获取可用的颜色索引 - 修改为服务器协调的方式
  const getAvailableColorIndex = (activeUserIds: string[]) => {
    try {
      // 尝试从localStorage获取颜色分配信息
      const storedColorsStr = localStorage.getItem(USER_COLOR_INDEX_KEY);
      let storedColors: Record<string, number> = {};
      
      if (storedColorsStr) {
        storedColors = JSON.parse(storedColorsStr);
      }
      
      // 如果此用户已有颜色索引，优先使用
      if (storedColors[userId] !== undefined) {
        return storedColors[userId];
      }
      
      // 获取当前已分配的颜色索引
      const usedColorIndices = new Set<number>();
      activeUserIds.forEach(id => {
        if (storedColors[id] !== undefined) {
          usedColorIndices.add(storedColors[id]);
        }
      });
      
      // 查找未使用的最小索引
      for (let i = 0; i < USER_COLORS.length; i++) {
        if (!usedColorIndices.has(i)) {
          // 保存新分配的颜色索引
          storedColors[userId] = i;
          localStorage.setItem(USER_COLOR_INDEX_KEY, JSON.stringify(storedColors));
          console.log(`分配颜色索引 ${i} 给用户 ${userId}`);
          return i;
        }
      }
      
      // 如果所有颜色都已分配，使用哈希函数确保同一用户在不同会话中获得相同的颜色
      const hashCode = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = ((hash << 5) - hash) + str.charCodeAt(i);
          hash |= 0; // Convert to 32bit integer
        }
        return Math.abs(hash);
      };
      
      const newIndex = hashCode(userId) % USER_COLORS.length;
      storedColors[userId] = newIndex;
      localStorage.setItem(USER_COLOR_INDEX_KEY, JSON.stringify(storedColors));
      console.log(`循环分配颜色索引 ${newIndex} 给用户 ${userId}`);
      return newIndex;
    } catch (e) {
      console.error('获取颜色索引出错:', e);
      return 0; // 出错时默认使用第一个颜色
    }
  };

  // 更新用户颜色分配
  const updateUserColors = (activeUserIds: string[]) => {
    try {
      const storedColorsStr = localStorage.getItem(USER_COLOR_INDEX_KEY);
      let storedColors: Record<string, number> = {};
      
      if (storedColorsStr) {
        storedColors = JSON.parse(storedColorsStr);
      }
      
      // 清理不在活跃用户列表中的用户
      const newStoredColors: Record<string, number> = {};
      activeUserIds.forEach(id => {
        if (storedColors[id] !== undefined) {
          newStoredColors[id] = storedColors[id];
        }
      });
      
      localStorage.setItem(USER_COLOR_INDEX_KEY, JSON.stringify(newStoredColors));
    } catch (e) {
      console.error('更新颜色索引出错:', e);
    }
  };

  // 保存用户选择到localStorage
  const saveSelectionsToLocalStorage = (userId: string, selections: Record<string, boolean>) => {
    try {
      // 获取现有的选择
      const selectionsStr = localStorage.getItem(USER_SELECTIONS_KEY);
      let allSelections: Record<string, Record<string, boolean>> = {};
      
      if (selectionsStr) {
        allSelections = JSON.parse(selectionsStr);
      }
      
      // 更新特定用户的选择
      allSelections[userId] = selections;
      
      // 保存回localStorage
      localStorage.setItem(USER_SELECTIONS_KEY, JSON.stringify(allSelections));
    } catch (e) {
      console.error('保存选择到localStorage出错:', e);
    }
  };
  
  // 从localStorage加载所有用户选择
  const loadSelectionsFromLocalStorage = () => {
    try {
      const selectionsStr = localStorage.getItem(USER_SELECTIONS_KEY);
      if (selectionsStr) {
        const allSelections = JSON.parse(selectionsStr);
        // 更新状态
        setAllUserSelections(allSelections);
        
        // 更新用户信息
        const newUserInfo = { ...allUserInfo };
        Object.keys(allSelections).forEach(uid => {
          if (newUserInfo[uid]) {
            newUserInfo[uid].selections = allSelections[uid];
          } else {
            // 如果没有此用户的信息，尝试从localStorage获取颜色信息
            try {
              const colorData = localStorage.getItem(USER_COLOR_INDEX_KEY);
              let colorIndex = 0;
              if (colorData) {
                const colors = JSON.parse(colorData);
                if (colors[uid] !== undefined) {
                  colorIndex = colors[uid];
                }
              }
              
              newUserInfo[uid] = {
                id: uid,
                colorIndex,
                selections: allSelections[uid]
              };
            } catch (e) {
              console.error('获取用户颜色出错:', e);
              // 默认使用颜色0
              newUserInfo[uid] = {
                id: uid,
                colorIndex: 0,
                selections: allSelections[uid]
              };
            }
          }
        });
        
        setAllUserInfo(newUserInfo);
      }
    } catch (e) {
      console.error('从localStorage加载选择出错:', e);
    }
  };
  
  // 清理过期选择
  const cleanupOldSelections = () => {
    try {
      const selectionsStr = localStorage.getItem(USER_SELECTIONS_KEY);
      if (selectionsStr) {
        const allSelections = JSON.parse(selectionsStr);
        const activeUserIds = getAllActiveUserIds();
        
        // 只保留活跃用户的选择
        const newSelections: Record<string, Record<string, boolean>> = {};
        activeUserIds.forEach(uid => {
          if (allSelections[uid]) {
            newSelections[uid] = allSelections[uid];
          }
        });
        
        localStorage.setItem(USER_SELECTIONS_KEY, JSON.stringify(newSelections));
      }
    } catch (e) {
      console.error('清理旧选择出错:', e);
    }
  };

  // 初始化Socket.io连接
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // 创建Socket.io连接
        console.log('正在连接到WebSocket服务器:', SOCKET_SERVER_URL);
        console.log('当前用户ID:', userId);
        socket = io(SOCKET_SERVER_URL, {
          transports: ['websocket', 'polling'], // 添加polling作为备选
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });
        
        // 从localStorage加载现有的选择
        loadSelectionsFromLocalStorage();
        
        // 清理过期选择
        cleanupOldSelections();
        
        // 设置连接超时计时器 - 5秒后如果还没收到响应，自动允许用户
        const connectionTimeout = setTimeout(() => {
          if (isLoading) {
            console.log('连接超时，自动允许用户');
            setIsLoading(false);
            setIsUserAllowed(true);
            
            // 获取活跃用户并分配颜色
            const activeUserIds = getAllActiveUserIds();
            const colorIdx = getAvailableColorIndex(activeUserIds);
            setUserColorIndex(colorIdx);
            
            // 初始化自身用户信息
            setAllUserInfo({
              [userId]: {
                id: userId,
                colorIndex: colorIdx,
                selections: {}
              }
            });
            
            // 将用户添加到本地存储
            localStorage.setItem(`meeting-user-${userId}`, JSON.stringify({
              connected: true,
              timestamp: Date.now(),
              colorIndex: colorIdx
            }));
            
            // 通过WebSocket广播用户加入消息
            if (socket && socket.connected) {
              socket.emit('USER_JOINED', {
                userId,
                selectedTimes: {},
                colorIndex: colorIdx
              });
              
              // 请求所有在线用户的选择
              socket.emit('REQUEST_ALL_SELECTIONS', { userId });
              
              // 延迟3秒后，再次尝试同步所有选择（以防第一次请求没有收到足够的响应）
              setTimeout(syncAllSelections, 3000);
            }
          }
        }, 5000);
        
        // 请求更新用户数量
        if (socket) {
          socket.emit('REQUEST_USER_COUNT', { userId });
        }
        
        // 监听Socket.io连接事件
        socket.on('connect', () => {
          console.log('已连接到WebSocket服务器');
          // 连接后立即请求用户数量
          socket?.emit('REQUEST_USER_COUNT', { userId });
        });
        
        socket.on('disconnect', () => {
          console.log('与WebSocket服务器断开连接');
        });
        
        socket.on('error', (error) => {
          console.error('WebSocket连接错误:', error);
        });
        
        // 监听服务器消息
        socket.on('USER_COUNT_RESPONSE', (data) => {
          const { allUsers, allowedUsers } = data;
          
          // 收到响应，清除超时计时器
          clearTimeout(connectionTimeout);
          
          // 检查当前用户是否在允许的用户列表中
          const isAllowed = allowedUsers.includes(userId) || allowedUsers.length < 5;
          setIsUserAllowed(isAllowed);
          setUserCount(allUsers);
          setIsLoading(false);
          
          // 如果用户被允许，发送加入消息
          if (isAllowed) {
            // 分配颜色索引
            const colorIdx = getAvailableColorIndex(allowedUsers);
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
            
            if (socket) {
              socket.emit('USER_JOINED', {
                userId,
                selectedTimes: {},
                colorIndex: colorIdx
              });
            }
            
            // 更新自身信息为已连接状态
            localStorage.setItem(`meeting-user-${userId}`, JSON.stringify({
              connected: true,
              timestamp: Date.now(),
              colorIndex: colorIdx
            }));
            
            // 请求所有在线用户的选择
            if (socket) {
              socket.emit('REQUEST_ALL_SELECTIONS', { userId });
            }
            
            // 延迟3秒后，再次尝试同步所有选择
            setTimeout(syncAllSelections, 3000);
          }
        });
        
        socket.on('USER_JOINED', (data) => {
          const { userId: senderId, selectedTimes: senderTimes, colorIndex: senderColorIndex } = data;
          
          console.log(`收到USER_JOINED事件: ${senderId}, 颜色索引: ${senderColorIndex}`);
          
          // 如果是当前用户，更新本地颜色索引
          if (senderId === userId) {
            console.log(`更新当前用户颜色索引为服务器分配的索引: ${senderColorIndex}`);
            setUserColorIndex(senderColorIndex !== undefined ? senderColorIndex : 0);
            
            // 更新本地存储
            const storedColorsStr = localStorage.getItem(USER_COLOR_INDEX_KEY) || '{}';
            const storedColors = JSON.parse(storedColorsStr);
            storedColors[userId] = senderColorIndex;
            localStorage.setItem(USER_COLOR_INDEX_KEY, JSON.stringify(storedColors));
          } 
          // 如果是其他用户，更新用户信息
          else {
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
            if (socket) {
              socket.emit('CURRENT_SELECTION', {
                userId,
                selectedTimes,
                colorIndex: userColorIndex
              });
            }
            
            // 同时发送所有已知的其他用户选择
            Object.keys(allUserInfo).forEach(uid => {
              if (uid !== userId && uid !== senderId && allUserInfo[uid]) {
                if (socket) {
                  socket.emit('OTHER_USER_SELECTION', {
                    userId,
                    targetUserId: uid,
                    selectedTimes: allUserInfo[uid].selections,
                    colorIndex: allUserInfo[uid].colorIndex,
                    receiverId: senderId
                  });
                }
              }
            });
          }
        });
        
        socket.on('CURRENT_SELECTION', (data) => {
          const { userId: senderId, selectedTimes: senderTimes, colorIndex: senderColorIndex } = data;
          
          if (senderId !== userId) {
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
            
            // 保存到localStorage
            saveSelectionsToLocalStorage(senderId, senderTimes || {});
          }
        });
        
        socket.on('OTHER_USER_SELECTION', (data) => {
          const { targetUserId, selectedTimes: targetSelections, colorIndex: targetColorIndex, receiverId } = data;
          
          if (receiverId === userId && targetUserId && targetSelections) {
            // 更新其他用户的选择
            setAllUserSelections(prev => ({
              ...prev,
              [targetUserId]: targetSelections
            }));
            
            // 更新用户信息
            setAllUserInfo(prev => ({
              ...prev,
              [targetUserId]: {
                id: targetUserId,
                colorIndex: targetColorIndex !== undefined ? targetColorIndex : 0,
                selections: targetSelections || {}
              }
            }));
            
            // 保存到localStorage
            saveSelectionsToLocalStorage(targetUserId, targetSelections || {});
          }
        });
        
        socket.on('TIME_SELECTED', (data) => {
          const { userId: senderId, selectedTimes: senderTimes } = data;
          
          if (senderId !== userId) {
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
            
            // 保存到localStorage
            saveSelectionsToLocalStorage(senderId, senderTimes || {});
          }
        });
        
        socket.on('USER_LEFT', (data) => {
          const { userId: senderId } = data;
          
          if (senderId !== userId) {
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
            
            // 更新颜色分配
            const activeUserIds = getAllActiveUserIds();
            updateUserColors(activeUserIds);
          }
        });
        
        socket.on('USER_COUNT', (data) => {
          setUserCount(data.allUsers);
        });
        
        socket.on('REQUEST_USER_COUNT', (data) => {
          // 响应请求用户数量 - 服务器将处理此请求
          const activeUsers = checkUserCount();
          const activeUserIds = getAllActiveUserIds();
          
          if (socket) {
            socket.emit('USER_COUNT_RESPONSE_TO_SERVER', {
              requesterId: data.userId,
              activeUsers,
              activeUserIds
            });
          }
        });
        
        socket.on('REQUEST_ALL_SELECTIONS', (data) => {
          if (data.userId !== userId) {
            // 响应发送自己的选择
            if (socket) {
              socket.emit('CURRENT_SELECTION', {
                userId,
                selectedTimes,
                colorIndex: userColorIndex,
                requesterId: data.userId
              });
            }
          }
        });

        // 页面卸载前通知其他用户
        window.addEventListener('beforeunload', handleBeforeUnload);

        // 定期检查用户计数
        const interval = setInterval(checkUserCount, 5000);
        
        // 定期同步选择 - 每30秒广播一次当前状态
        const syncInterval = setInterval(() => {
          if (socket && socket.connected && isUserAllowed) {
            // 广播当前用户的选择
            socket.emit('CURRENT_SELECTION', {
              userId,
              selectedTimes,
              colorIndex: userColorIndex
            });
            
            // 更新最后活动时间
            if (userCount > 0) {
              localStorage.setItem(`meeting-user-${userId}`, JSON.stringify({
                connected: true,
                timestamp: Date.now(),
                colorIndex: userColorIndex
              }));
            }
          }
        }, 30000);
        
        return () => {
          clearTimeout(connectionTimeout);
          clearInterval(interval);
          clearInterval(syncInterval);
          handleBeforeUnload();
          window.removeEventListener('beforeunload', handleBeforeUnload);
          if (socket) {
            socket.disconnect();
          }
        };
      } catch (error) {
        console.error('初始化通信渠道失败:', error);
        setIsLoading(false);
        setIsUserAllowed(true); // 出错时默认允许用户
        
        // 分配默认颜色
        const activeUserIds = getAllActiveUserIds();
        const colorIdx = getAvailableColorIndex(activeUserIds);
        setUserColorIndex(colorIdx);
        
        // 将用户添加到本地存储
        localStorage.setItem(`meeting-user-${userId}`, JSON.stringify({
          connected: true,
          timestamp: Date.now(),
          colorIndex: colorIdx
        }));
        
        // 初始化自身用户信息
        setAllUserInfo({
          [userId]: {
            id: userId,
            colorIndex: colorIdx,
            selections: {}
          }
        });
      }
    }
  }, [userId, isLoading, selectedTimes, userColorIndex]);

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

  // 同步所有已知的选择
  const syncAllSelections = () => {
    try {
      // 1. 从localStorage加载选择
      loadSelectionsFromLocalStorage();
      
      // 2. 请求网络上的实时数据
      if (socket && socket.connected) {
        socket.emit('REQUEST_ALL_SELECTIONS', { userId });
      }
      
      // 3. 同步自己的选择到网络
      if (socket && socket.connected) {
        socket.emit('CURRENT_SELECTION', {
          userId,
          selectedTimes,
          colorIndex: userColorIndex
        });
      }
      
      console.log('已同步所有选择数据');
    } catch (e) {
      console.error('同步选择出错:', e);
    }
  };

  // 处理页面卸载
  const handleBeforeUnload = () => {
    if (socket && socket.connected) {
      socket.emit('USER_LEFT', { userId });
    }
    localStorage.removeItem(`meeting-user-${userId}`);
  };

  // 检查和更新用户计数
  const checkUserCount = () => {
    const userIds = getAllActiveUserIds();
    
    // 限制最多5个用户
    const activeUsers = Math.min(userIds.length, 5);
    
    // 广播用户数量
    if (socket && socket.connected) {
      socket.emit('USER_COUNT', { 
        userId,
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
      if (socket && socket.connected) {
        socket.emit('TIME_SELECTED', {
          userId,
          selectedTimes: newSelection,
          colorIndex: userColorIndex
        });
      }
      
      // 保存到localStorage
      saveSelectionsToLocalStorage(userId, newSelection);
      
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
      if (socket && socket.connected) {
        socket.emit('TIME_SELECTED', {
          userId,
          selectedTimes: newSelection,
          colorIndex: userColorIndex
        });
      }
      
      // 保存到localStorage
      saveSelectionsToLocalStorage(userId, newSelection);
      
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
    if (socket && socket.connected) {
      socket.emit('TIME_SELECTED', {
        userId,
        selectedTimes: {},
        colorIndex: userColorIndex
      });
    }
    
    // 保存到localStorage
    saveSelectionsToLocalStorage(userId, {});
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