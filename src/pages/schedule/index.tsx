import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { useGoalStore } from '@/store/useGoalStore';
import type { Schedule } from '@/types';

const SchedulePage: React.FC = () => {
  const { schedules, goals, getSchedulesByDate, checkDateConflict } = useGoalStore();
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [refreshing, setRefreshing] = useState(false);
  
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  
  const calendarDays = useMemo(() => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startDay = startOfMonth.day();
    const daysInMonth = endOfMonth.date();
    
    const days: Array<{
      date: dayjs.Dayjs;
      isCurrentMonth: boolean;
      hasEvent: boolean;
      hasConflict: boolean;
      isToday: boolean;
      isSelected: boolean;
    }> = [];
    
    for (let i = 0; i < startDay; i++) {
      const date = startOfMonth.subtract(startDay - i, 'day');
      days.push({
        date,
        isCurrentMonth: false,
        hasEvent: schedules.some(s => s.date === date.format('YYYY-MM-DD')),
        hasConflict: schedules.some(s => s.date === date.format('YYYY-MM-DD') && s.conflict),
        isToday: date.isSame(dayjs(), 'day'),
        isSelected: date.isSame(selectedDate, 'day')
      });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = startOfMonth.date(i);
      days.push({
        date,
        isCurrentMonth: true,
        hasEvent: schedules.some(s => s.date === date.format('YYYY-MM-DD')),
        hasConflict: schedules.some(s => s.date === date.format('YYYY-MM-DD') && s.conflict),
        isToday: date.isSame(dayjs(), 'day'),
        isSelected: date.isSame(selectedDate, 'day')
      });
    }
    
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = endOfMonth.add(i, 'day');
      days.push({
        date,
        isCurrentMonth: false,
        hasEvent: schedules.some(s => s.date === date.format('YYYY-MM-DD')),
        hasConflict: schedules.some(s => s.date === date.format('YYYY-MM-DD') && s.conflict),
        isToday: date.isSame(dayjs(), 'day'),
        isSelected: date.isSame(selectedDate, 'day')
      });
    }
    
    return days;
  }, [currentMonth, selectedDate, schedules]);
  
  const selectedDateSchedules = useMemo(() => {
    return getSchedulesByDate(selectedDate.format('YYYY-MM-DD'));
  }, [selectedDate, schedules]);
  
  const hasConflict = useMemo(() => {
    return selectedDateSchedules.some(s => s.conflict);
  }, [selectedDateSchedules]);
  
  const handlePrevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, 'month'));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.add(1, 'month'));
  };
  
  const handleSelectDate = (date: dayjs.Dayjs) => {
    setSelectedDate(date);
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
      console.log('[SchedulePage] Pull down refresh completed');
    }, 1000);
  };
  
  const handleScheduleClick = (schedule: Schedule) => {
    if (schedule.goalId) {
      Taro.navigateTo({
        url: `/pages/goal-detail/index?id=${schedule.goalId}`
      });
    }
  };
  
  const getGoalTitle = (goalId?: string) => {
    if (!goalId) return '';
    const goal = goals.find(g => g.id === goalId);
    return goal?.title || '';
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deadline':
        return '⏰';
      case 'reminder':
        return '🔔';
      case 'meeting':
        return '👨‍👩‍👧‍👦';
      default:
        return '📌';
    }
  };
  
  return (
    <ScrollView
      className={styles.schedulePage}
      scrollY
      refresherEnabled
      refresherTriggered={refreshing}
      onRefresherRefresh={handleRefresh}
    >
      <View className={styles.calendarHeader}>
        <View className={styles.monthSelector}>
          <View className={styles.navButton} onClick={handlePrevMonth}>
            <Text>‹</Text>
          </View>
          <Text className={styles.monthText}>
            {currentMonth.format('YYYY年MM月')}
          </Text>
          <View className={styles.navButton} onClick={handleNextMonth}>
            <Text>›</Text>
          </View>
        </View>
        
        <View className={styles.weekDays}>
          {weekDays.map(day => (
            <Text key={day} className={styles.weekDay}>{day}</Text>
          ))}
        </View>
        
        <View className={styles.calendarDays}>
          {calendarDays.map((day, index) => (
            <View
              key={index}
              className={classnames(styles.dayCell, day.hasConflict && styles.conflict)}
              onClick={() => handleSelectDate(day.date)}
            >
              <View
                className={classnames(
                  styles.dayNumber,
                  day.hasEvent && styles.hasEvent,
                  day.isSelected && styles.selected,
                  day.isToday && styles.today
                )}
              >
                <Text>{day.date.date()}</Text>
              </View>
              {day.hasEvent && <View className={styles.eventDot}></View>}
            </View>
          ))}
        </View>
      </View>
      
      <View className={styles.content}>
        <View className={styles.dateHeader}>
          <Text className={styles.dateText}>
            {selectedDate.format('MM月DD日 dddd')}
          </Text>
          <Text className={styles.scheduleCount}>
            共 {selectedDateSchedules.length} 项安排
          </Text>
        </View>
        
        {hasConflict && (
          <View className={styles.conflictWarning}>
            <Text className={styles.warningIcon}>⚠️</Text>
            <Text className={styles.warningText}>
              今日存在日程冲突，请合理安排时间
            </Text>
          </View>
        )}
        
        <View className={styles.scheduleList}>
          {selectedDateSchedules.map(schedule => (
            <View
              key={schedule.id}
              className={styles.scheduleItem}
              onClick={() => handleScheduleClick(schedule)}
            >
              <View className={classnames(styles.typeIcon, styles[schedule.type])}>
                <Text>{getTypeIcon(schedule.type)}</Text>
              </View>
              
              <View className={styles.scheduleContent}>
                <Text className={styles.scheduleTitle}>{schedule.title}</Text>
                <Text className={styles.scheduleTime}>
                  {schedule.time || '全天'}
                </Text>
                {schedule.goalId && (
                  <Text className={styles.scheduleGoal}>
                    {getGoalTitle(schedule.goalId)}
                  </Text>
                )}
              </View>
              
              {schedule.conflict && (
                <View className={classnames('tag', 'tagError', styles.conflictBadge)}>
                  冲突
                </View>
              )}
            </View>
          ))}
          
          {selectedDateSchedules.length === 0 && (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📅</Text>
              <Text className={styles.emptyText}>今日暂无日程安排</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default SchedulePage;
