'use client';

import React, { useState, useEffect } from 'react';
import { useMeeting } from '../context/MeetingContext';

// 用户颜色映射
const USER_COLORS = [
  { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', border: 'border-blue-600', text: 'text-blue-500' },
  { bg: 'bg-orange-500', hover: 'hover:bg-orange-600', border: 'border-orange-600', text: 'text-orange-500' },
  { bg: 'bg-pink-500', hover: 'hover:bg-pink-600', border: 'border-pink-600', text: 'text-pink-500' },
  { bg: 'bg-purple-500', hover: 'hover:bg-purple-600', border: 'border-purple-600', text: 'text-purple-500' },
  { bg: 'bg-amber-700', hover: 'hover:bg-amber-800', border: 'border-amber-800', text: 'text-amber-700' },
];

// 内联定义图标组件，避免模块导入问题
const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

// 生成一周的日期
const generateWeekDays = (startDate: Date) => {
  const days = [];
  const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  
  // 调整到周一开始
  const currentDay = new Date(startDate);
  const dayOfWeek = currentDay.getDay(); // 0是周日，1-6是周一到周六
  
  // 如果是周日，回退6天；否则回退到本周一
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  currentDay.setDate(currentDay.getDate() - daysToSubtract);
  
  // 生成一周的日期
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentDay);
    days.push({
      date,
      dayName: dayNames[i],
      dayOfMonth: date.getDate(),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      dateString: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    });
    currentDay.setDate(currentDay.getDate() + 1);
  }
  
  return days;
};

// 生成时间槽
const generateTimeSlots = (weekDays: ReturnType<typeof generateWeekDays>) => {
  // 从早上8点到晚上22点，每30分钟一个时间槽
  const slots = [];
  
  for (let hour = 8; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      const timeString = `${formattedHour}:${formattedMinute}`;
      
      // 计算时间段标签（如 08:00-08:30）
      const nextHour = minute === 30 ? (hour + 1) : hour;
      const nextMinute = minute === 30 ? 0 : 30;
      const nextTimeString = `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;
      const timeRangeString = `${timeString}-${nextTimeString}`;
      
      for (const day of weekDays) {
        slots.push({
          id: `${day.dateString}-${timeString}`,
          day: day.dayName,
          date: day.date,
          dateString: day.dateString,
          dayOfMonth: day.dayOfMonth,
          month: day.month,
          time: timeString,
          timeRange: timeRangeString,
          fullDate: `${day.year}-${String(day.month).padStart(2, '0')}-${String(day.dayOfMonth).padStart(2, '0')} ${timeString}`
        });
      }
    }
  }
  
  return slots;
};

const TimeGrid: React.FC = () => {
  const { 
    userId, 
    selectedTimes, 
    commonTimes, 
    userCount, 
    selectTime, 
    unselectTime, 
    resetAllSelections,
    userColorClasses,
    userColorIndex,
    allUserInfo
  } = useMeeting();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());
  
  // 获取当前一周的日期
  const weekDays = generateWeekDays(currentWeekStart);
  const timeSlots = generateTimeSlots(weekDays);
  
  // 处理时间槽点击
  const handleTimeSlotClick = (slotId: string) => {
    if (selectedTimes[slotId]) {
      unselectTime(slotId);
    } else {
      selectTime(slotId);
    }
  };
  
  // 获取时间槽的样式
  const getTimeSlotClass = (slotId: string) => {
    // 检查是否是共同时间
    if (commonTimes[slotId]) {
      return 'bg-green-500 hover:bg-green-600 text-white font-medium border border-green-600'; // 所有用户共同选择的时间
    }
    
    // 检查当前用户是否选择
    if (selectedTimes[slotId]) {
      return `${userColorClasses.bg} ${userColorClasses.hover} text-white border ${userColorClasses.border}`;
    }
    
    // 检查其他用户是否选择
    for (const otherUserId in allUserInfo) {
      if (otherUserId !== userId && allUserInfo[otherUserId]?.selections[slotId]) {
        const colorIdx = allUserInfo[otherUserId].colorIndex;
        const userColor = colorIdx >= 0 && colorIdx < 5 ? 
          `bg-opacity-80 ${USER_COLORS[colorIdx].bg} ${USER_COLORS[colorIdx].hover} text-white border ${USER_COLORS[colorIdx].border}` : 
          'bg-gray-500 hover:bg-gray-600 text-white border border-gray-600';
        return userColor;
      }
    }
    
    // 默认样式
    return 'bg-gray-100 hover:bg-gray-300 border border-gray-300';
  };
  
  // 获取已选择此时间段的用户信息
  const getSlotUsers = (slotId: string) => {
    const users = [];
    for (const uid in allUserInfo) {
      if (allUserInfo[uid]?.selections[slotId]) {
        users.push(uid);
      }
    }
    return users;
  };
  
  // 生成时间槽提示文本
  const getSlotTooltip = (slotId: string, day: string, month: number, dayOfMonth: number, time: string) => {
    const users = getSlotUsers(slotId);
    let tooltip = `${day} ${month}月${dayOfMonth}日 ${time}`;
    
    if (users.length > 0) {
      tooltip += "\n已选择用户: " + users.length;
      if (commonTimes[slotId]) {
        tooltip += " (所有人都可用!)";
      }
    }
    
    return tooltip;
  };
  
  // 跳转到上一周
  const goToPreviousWeek = () => {
    const prevWeek = new Date(currentWeekStart);
    prevWeek.setDate(prevWeek.getDate() - 7);
    setCurrentWeekStart(prevWeek);
  };
  
  // 跳转到下一周
  const goToNextWeek = () => {
    const nextWeek = new Date(currentWeekStart);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setCurrentWeekStart(nextWeek);
  };
  
  // 跳转到今天所在的周
  const goToCurrentWeek = () => {
    setCurrentWeekStart(new Date());
  };
  
  // 跳转到指定日期所在的周
  const goToDate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = event.target.value;
    if (dateStr) {
      setCurrentWeekStart(new Date(dateStr));
    }
  };
  
  // 格式化当前显示的周信息
  const formatWeekRange = () => {
    const firstDay = weekDays[0];
    const lastDay = weekDays[6];
    
    const firstMonth = firstDay.month;
    const lastMonth = lastDay.month;
    
    if (firstMonth === lastMonth) {
      return `${firstDay.year}年${firstMonth}月${firstDay.dayOfMonth}日 - ${lastDay.dayOfMonth}日`;
    } else {
      return `${firstDay.year}年${firstMonth}月${firstDay.dayOfMonth}日 - ${lastMonth}月${lastDay.dayOfMonth}日`;
    }
  };
  
  // 按时间和天分组时间槽
  const timeSlotsByTime: Record<string, typeof timeSlots> = {};
  timeSlots.forEach(slot => {
    if (!timeSlotsByTime[slot.time]) {
      timeSlotsByTime[slot.time] = [];
    }
    timeSlotsByTime[slot.time].push(slot);
  });
  
  // 格式化为YYYY-MM-DD格式
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // 重置所有选择
  const handleResetAll = () => {
    if (window.confirm('确定要清除您所有的时间选择吗？')) {
      resetAllSelections();
    }
  };
  
  // 创建颜色图例
  const renderColorLegend = () => {
    const colorBoxes = [];
    
    // 当前用户的颜色
    colorBoxes.push(
      <div key="currentUser" className="flex items-center gap-2">
        <div className={`w-5 h-5 ${userColorClasses.bg} rounded`}></div>
        <span className="font-medium text-gray-800">您的选择 (用户{userColorIndex + 1})</span>
      </div>
    );
    
    // 共同时间的颜色
    colorBoxes.push(
      <div key="common" className="flex items-center gap-2">
        <div className="w-5 h-5 bg-green-500 rounded"></div>
        <span className="font-medium text-gray-800">所有人共同可用</span>
      </div>
    );
    
    // 其他在线用户的颜色
    const otherUserIds = Object.keys(allUserInfo).filter(uid => uid !== userId);
    otherUserIds.forEach(uid => {
      const userInfo = allUserInfo[uid];
      if (userInfo) {
        const colorIdx = userInfo.colorIndex;
        colorBoxes.push(
          <div key={uid} className="flex items-center gap-2">
            <div className={`w-5 h-5 ${USER_COLORS[colorIdx].bg} rounded`}></div>
            <span className="font-medium text-gray-800">用户{colorIdx + 1}的选择</span>
          </div>
        );
      }
    });
    
    return colorBoxes;
  };
  
  return (
    <div>
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse mr-2"></div>
            <p className="text-lg font-semibold text-gray-800">当前在线用户: <span className="text-blue-600 font-bold">{userCount}</span> / 5</p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            {renderColorLegend()}
          </div>
        </div>
      </div>
      
      {/* 日历控制区域 */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white border rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={goToPreviousWeek} 
            className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors"
            aria-label="上一周"
          >
            <ChevronLeftIcon />
          </button>
          
          <div className="text-center text-lg font-medium min-w-[200px]">
            {formatWeekRange()}
          </div>
          
          <button 
            onClick={goToNextWeek} 
            className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors"
            aria-label="下一周"
          >
            <ChevronRightIcon />
          </button>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <button 
            onClick={handleResetAll}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors font-medium mr-2"
          >
            一键重置
          </button>
          
          <button 
            onClick={goToCurrentWeek} 
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
          >
            回到本周
          </button>
          
          <div className="flex items-center gap-2">
            <label htmlFor="date-picker" className="text-sm font-medium text-gray-700">跳转到:</label>
            <input 
              id="date-picker"
              type="date" 
              onChange={goToDate} 
              className="px-3 py-2 border rounded-md text-sm"
              value={formatDateForInput(new Date(weekDays[0].date))}
            />
          </div>
        </div>
      </div>
      
      {/* 日历表格 */}
      <div className="border rounded-lg overflow-hidden shadow-lg">
        {/* 日期头部 */}
        <div className="grid grid-cols-8 bg-gray-200" style={{ 
          gridTemplateColumns: `120px repeat(7, 1fr)` 
        }}>
          <div className="bg-gray-800 text-white p-3 font-medium text-center border-r border-gray-700">
            时间/日期
          </div>
          
          {weekDays.map((day, index) => {
            const isToday = new Date().toDateString() === day.date.toDateString();
            const borderClass = index < 6 ? 'border-r border-gray-700' : '';
            return (
              <div 
                key={day.dateString}
                className={`${isToday ? 'bg-blue-700' : 'bg-gray-800'} text-white p-3 font-medium text-center ${borderClass}`}
              >
                <div className="text-lg">{day.dayName}</div>
                <div className="mt-1 font-bold">{day.month}月{day.dayOfMonth}日</div>
              </div>
            );
          })}
        </div>
        
        {/* 时间槽 */}
        <div>
          {Object.keys(timeSlotsByTime).sort().map((time, timeIndex) => {
            // 找到这个时间段的第一个槽，以获取时间范围
            const timeRange = timeSlotsByTime[time][0].timeRange;
            return (
              <div 
                key={time} 
                className={`grid grid-cols-8 ${timeIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                style={{ gridTemplateColumns: `120px repeat(7, 1fr)` }}
              >
                <div className="bg-gray-700 text-white p-3 text-center font-medium flex items-center justify-center border-r border-gray-600">
                  {timeRange}
                </div>
                
                {timeSlotsByTime[time].map((slot, index) => {
                  const borderClass = index < 6 ? 'border-r border-gray-200' : '';
                  const tooltipText = getSlotTooltip(slot.id, slot.day, slot.month, slot.dayOfMonth, slot.time);
                  return (
                    <button
                      key={slot.id}
                      className={`p-3 transition-colors duration-200 ${getTimeSlotClass(slot.id)} ${borderClass}`}
                      onClick={() => handleTimeSlotClick(slot.id)}
                      title={tooltipText}
                    >
                      &nbsp;
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TimeGrid; 