/**
 * WebSocket服务器实现 - 会议调度器
 * 
 * 主要功能:
 * 1. 跨设备实时通信
 * 2. 用户选择时间同步
 * 3. 用户状态管理
 * 4. 在线用户计数
 */

import { Server, Socket } from 'socket.io';
import http from 'http';
import express from 'express';
import cors from 'cors';

// 接口定义
interface UserSelection {
  [timeSlot: string]: boolean;
}

interface UserInfo {
  id: string;
  colorIndex: number;
  selections: UserSelection;
  lastActive: number;
  socketId: string;
}

// 存储用户信息
const users: Record<string, UserInfo> = {};

// 用于生成一致的颜色索引，确保同一用户始终获得相同的颜色
function getConsistentColorIndex(userId: string, usedIndices: Set<number>): number {
  // 为用户ID生成0-4之间的哈希值
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };
  
  // 尝试分配尚未使用的颜色索引
  for (let i = 0; i < 5; i++) {
    const idx = (hashCode(userId) + i) % 5;
    if (!usedIndices.has(idx)) {
      return idx;
    }
  }
  
  // 如果所有颜色都已被使用，简单地根据用户ID取模
  return hashCode(userId) % 5;
}

// 获取活跃用户列表，按照连接时间排序
function getActiveUsers(): { id: string, colorIndex: number }[] {
  const now = Date.now();
  const activeUsers = Object.values(users)
    .filter(user => now - user.lastActive < 5 * 60 * 1000)
    .sort((a, b) => {
      // 首先按颜色索引排序
      if (a.colorIndex !== b.colorIndex) {
        return a.colorIndex - b.colorIndex;
      }
      // 如果颜色索引相同，按ID排序
      return a.id.localeCompare(b.id);
    });
  
  return activeUsers.map(user => ({ id: user.id, colorIndex: user.colorIndex }));
}

// 创建Express应用
const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: false
}));

// 创建HTTP服务器
const server = http.createServer(app);

// 配置Socket.io服务器
const io = new Server(server, {
  cors: {
    origin: '*', // 在生产环境中应该限制为特定域名
    methods: ['GET', 'POST'],
    credentials: false
  }
});

// 首页路由
app.get('/', (req, res) => {
  res.send('WebSocket服务器正在运行 - 会议调度器');
});

// 当有客户端连接时
io.on('connection', (socket: Socket) => {
  console.log(`用户已连接: ${socket.id}`);

  // 用户加入
  socket.on('USER_JOINED', (data) => {
    const { userId, selectedTimes, colorIndex } = data;
    
    // 获取当前的活跃用户
    const activeUsers = getActiveUsers();
    const usedColorIndices = new Set(activeUsers.map(user => user.colorIndex));
    
    // 确定新用户的颜色索引
    let assignedColorIndex = colorIndex;
    
    // 如果没有提供颜色索引或该索引已被使用，分配新的
    if (assignedColorIndex === undefined || usedColorIndices.has(assignedColorIndex)) {
      assignedColorIndex = getConsistentColorIndex(userId, usedColorIndices);
    }
    
    console.log(`分配颜色索引 ${assignedColorIndex} 给用户 ${userId}`);
    
    // 更新用户信息
    users[userId] = {
      id: userId,
      colorIndex: assignedColorIndex,
      selections: selectedTimes || {},
      lastActive: Date.now(),
      socketId: socket.id  // 存储socket ID用于disconnect时识别用户
    };
    
    console.log(`用户加入: ${userId}, 颜色: ${assignedColorIndex}`);
    
    // 广播给所有其他用户
    socket.broadcast.emit('USER_JOINED', {
      userId,
      selectedTimes,
      colorIndex: assignedColorIndex
    });
    
    // 广播更新的用户数量
    broadcastUserCount();
  });

  // 用户当前选择
  socket.on('CURRENT_SELECTION', (data) => {
    const { userId, selectedTimes, colorIndex, requesterId } = data;
    
    // 更新用户信息
    if (users[userId]) {
      users[userId].selections = selectedTimes || {};
      users[userId].lastActive = Date.now();
      
      if (colorIndex !== undefined) {
        users[userId].colorIndex = colorIndex;
      }
    } else {
      users[userId] = {
        id: userId,
        colorIndex: colorIndex || 0,
        selections: selectedTimes || {},
        lastActive: Date.now(),
        socketId: socket.id  // 存储socket ID用于disconnect时识别用户
      };
    }
    
    // 如果有特定的请求者，只发送给请求者
    if (requesterId) {
      io.emit('CURRENT_SELECTION', {
        userId,
        selectedTimes,
        colorIndex: users[userId].colorIndex
      });
    } else {
      // 否则广播给所有用户
      io.emit('CURRENT_SELECTION', {
        userId,
        selectedTimes,
        colorIndex: users[userId].colorIndex
      });
    }
  });

  // 其他用户选择信息 (转发第三方用户信息)
  socket.on('OTHER_USER_SELECTION', (data) => {
    const { targetUserId, selectedTimes, colorIndex, receiverId } = data;
    
    if (receiverId) {
      io.emit('OTHER_USER_SELECTION', {
        targetUserId,
        selectedTimes,
        colorIndex,
        receiverId
      });
    }
  });

  // 选择时间更新
  socket.on('TIME_SELECTED', (data) => {
    const { userId, selectedTimes, colorIndex } = data;
    
    // 更新用户信息
    if (users[userId]) {
      users[userId].selections = selectedTimes || {};
      users[userId].lastActive = Date.now();
      
      if (colorIndex !== undefined) {
        users[userId].colorIndex = colorIndex;
      }
    }
    
    // 广播给所有用户
    io.emit('TIME_SELECTED', {
      userId,
      selectedTimes,
      colorIndex: users[userId]?.colorIndex || 0
    });
  });

  // 用户离开
  socket.on('USER_LEFT', (data) => {
    const { userId } = data;
    
    // 删除用户信息
    if (users[userId]) {
      delete users[userId];
      console.log(`用户离开: ${userId}`);
    }
    
    // 广播给所有其他用户
    socket.broadcast.emit('USER_LEFT', { userId });
    
    // 广播更新的用户数量
    broadcastUserCount();
  });

  // 用户数量请求
  socket.on('REQUEST_USER_COUNT', (data) => {
    const { userId } = data;
    
    // 清理不活跃的用户
    cleanupInactiveUsers();
    
    // 获取活跃用户
    const activeUsers = getActiveUsers();
    const activeUserIds = activeUsers.map(user => user.id);
    
    // 如果这是新用户，并且我们已经有5个活跃用户，拒绝新用户
    const allowedUsers = activeUserIds.slice(0, 5);
    const isUserAllowed = allowedUsers.includes(userId) || allowedUsers.length < 5;
    
    console.log(`用户请求计数 ${userId}, 允许状态: ${isUserAllowed}, 当前用户: ${activeUserIds.length}`);
    
    // 回复请求者用户数量
    socket.emit('USER_COUNT_RESPONSE', {
      allUsers: activeUserIds.length,
      allowedUsers: allowedUsers
    });
  });

  // 用户数量响应
  socket.on('USER_COUNT_RESPONSE_TO_SERVER', (data) => {
    const { requesterId, activeUsers, activeUserIds } = data;
    
    // 向请求者转发用户数量响应
    io.emit('USER_COUNT_RESPONSE', {
      allUsers: activeUsers,
      allowedUsers: activeUserIds?.slice(0, 5) || []
    });
  });

  // 请求所有选择
  socket.on('REQUEST_ALL_SELECTIONS', (data) => {
    const { userId } = data;
    
    // 广播请求给所有用户
    socket.broadcast.emit('REQUEST_ALL_SELECTIONS', { userId });
  });

  // 用户数量更新
  socket.on('USER_COUNT', (data) => {
    const { allUsers } = data;
    
    // 广播用户数量
    io.emit('USER_COUNT', { allUsers });
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log(`用户断开连接: ${socket.id}`);
    
    // 尝试查找并移除断开的用户
    let disconnectedUserId = null;
    for (const userId in users) {
      if (users[userId].socketId === socket.id) {
        disconnectedUserId = userId;
        break;
      }
    }
    
    if (disconnectedUserId) {
      console.log(`识别到断开的用户: ${disconnectedUserId}`);
      delete users[disconnectedUserId];
      
      // 广播用户离开事件
      socket.broadcast.emit('USER_LEFT', { userId: disconnectedUserId });
      
      // 更新用户计数
      broadcastUserCount();
    }
  });
});

// 广播用户数量
function broadcastUserCount() {
  const activeUsers = getActiveUsers();
  io.emit('USER_COUNT', { allUsers: activeUsers.length });
  console.log(`广播用户数量: ${activeUsers.length}, 用户: ${activeUsers.map(u => u.id).join(', ')}`);
}

// 清理不活跃的用户（5分钟没有活动）
function cleanupInactiveUsers() {
  const now = Date.now();
  let isChanged = false;
  const allUsers = Object.keys(users);
  const activeUsers = getActiveUsers();
  const activeUserIds = new Set(activeUsers.map(user => user.id));
  
  // 查找不在活跃用户列表中的用户
  for (const userId of allUsers) {
    if (!activeUserIds.has(userId)) {
      delete users[userId];
      isChanged = true;
      console.log(`清理不活跃用户: ${userId}`);
    }
  }
  
  // 如果有用户被清理，广播更新的用户数量
  if (isChanged) {
    broadcastUserCount();
  }
}

// 定期清理不活跃用户（每分钟）
setInterval(cleanupInactiveUsers, 60 * 1000);

// 监听3001端口
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
console.log('正在启动WebSocket服务器...');
// 使用标准的listen方法，只传递端口号
server.listen(PORT, () => {
  console.log('=======================================');
  console.log(`WebSocket服务器已启动，监听端口: ${PORT}`);
  console.log(`可通过 http://localhost:${PORT} 或 http://<本机IP地址>:${PORT} 从其他设备访问`);
  console.log('=======================================');
}); 