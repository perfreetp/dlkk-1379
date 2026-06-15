import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { useGoalStore } from '@/store/useGoalStore';
import type { Schedule } from '@/types';

const SchedulePage: React.FC = () => {
  const { schedules, goals, members, getSchedulesByDate, getSchedulesFiltered, getUnreadCount } = useGoalStore();
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [refreshing, setRefreshing] = useState(false);
  const [filterMemberId, setFilterMemberId] = useState('');
  const [filterGoalId, setFilterGoalId] = useState('');

  const unreadCount = getUnreadCount();
  
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const filteredSchedules = useMemo(() => {
    if (!filterMemberId && !filterGoalId) return schedules;
    return getSchedulesFiltered({ memberId: filterMemberId || undefined, goalId: filterGoalId || undefined });
  }, [schedules, filterMemberId, filterGoalId, getSchedulesFiltered]);

  const memberPickerList = useMemo(() => ['全部成员', ...members.map(m => m.name)], [members]);
  const goalPickerList = useMemo(() => ['全部目标', ...goals.map(g => g.title)], [goals]);

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
        date, isCurrentMonth: false,
        hasEvent: filteredSchedules.some(s => s.date === date.format('YYYY-MM-DD')),
        hasConflict: filteredSchedules.some(s => s.date === date.format('YYYY-MM-DD') && s.conflict),
        isToday: date.isSame(dayjs(), 'day'), isSelected: date.isSame(selectedDate, 'day')
      });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = startOfMonth.date(i);
      days.push({
        date, isCurrentMonth: true,
        hasEvent: filteredSchedules.some(s => s.date === date.format('YYYY-MM-DD')),
        hasConflict: filteredSchedules.some(s => s.date === date.format('YYYY-MM-DD') && s.conflict),
        isToday: date.isSame(dayjs(), 'day'), isSelected: date.isSame(selectedDate, 'day')
      });
    }
    
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = endOfMonth.add(i, 'day');
      days.push({
        date, isCurrentMonth: false,
        hasEvent: filteredSchedules.some(s => s.date === date.format('YYYY-MM-DD')),
        hasConflict: filteredSchedules.some(s => s.date === date.format('YYYY-MM-DD') && s.conflict),
        isToday: date.isSame(dayjs(), 'day'), isSelected: date.isSame(selectedDate, 'day')
      });
    }
    
    return days;
  }, [currentMonth, selectedDate, filteredSchedules]);
  
  const selectedDateSchedules = useMemo(() => {
    const dateStr = selectedDate.format('YYYY-MM-DD');
    if (!filterMemberId && !filterGoalId) {
      return getSchedulesByDate(dateStr);
    }
    return getSchedulesFiltered({ memberId: filterMemberId || undefined, goalId: filterGoalId || undefined })
      .filter(s => s.date === dateStr);
  }, [selectedDate, filteredSchedules, filterMemberId, filterGoalId, getSchedulesByDate, getSchedulesFiltered]);
  
  const hasConflict = useMemo(() => {
    return selectedDateSchedules.some(s => s.conflict);
  }, [selectedDateSchedules]);
  
  const handlePrevMonth = () => setCurrentMonth(currentMonth.subtract(1, 'month'));
  const handleNextMonth = () => setCurrentMonth(currentMonth.add(1, 'month'));
  const handleSelectDate = (date: dayjs.Dayjs) => setSelectedDate(date);
  
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); Taro.stopPullDownRefresh(); }, 1000);
  };

  const handleMemberPickerChange = (e) => {
    const idx = e.detail.value;
    setFilterMemberId(idx === 0 ? '' : members[idx - 1]?.id || '');
  };

  const handleGoalPickerChange = (e) => {
    const idx = e.detail.value;
    setFilterGoalId(idx === 0 ? '' : goals[idx - 1]?.id || '');
  };
  
  const handleScheduleClick = (schedule: Schedule) => {
    if (schedule.taskId) {
      Taro.navigateTo({ url: `/pages/goal-detail/index?id=${schedule.goalId}&tab=tasks&taskId=${schedule.taskId}` });
    } else if (schedule.goalId) {
      Taro.navigateTo({ url: `/pages/goal-detail/index?id=${schedule.goalId}` });
    }
  };
  
  const getGoalTitle = (goalId?: string) => {
    if (!goalId) return '';
    return goals.find(g => g.id === goalId)?.title || '';
  };

  const getTaskAssignee = (goalId?: string, taskId?: string) => {
    if (!goalId || !taskId) return '';
    const goal = goals.find(g => g.id === goalId);
    const task = goal?.tasks.find(t => t.id === taskId);
    if (!task) return '';
    return members.find(m => m.id === task.assigneeId)?.name || '';
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deadline': return '⏰';
      case 'reminder': return '🔔';
      case 'meeting': return '👨‍👩‍👧‍👦';
      default: return '📌';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'deadline': return '截止';
      case 'reminder': return '提醒';
      case 'meeting': return '会议';
      default: return '其他';
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
        <View className={styles.headerTop}>
          <View className={styles.monthSelector}>
            <View className={styles.navButton} onClick={handlePrevMonth}><Text>‹</Text></View>
            <Text className={styles.monthText}>{currentMonth.format('YYYY年MM月')}</Text>
            <View className={styles.navButton} onClick={handleNextMonth}><Text>›</Text></View>
          </View>
          <View
            className={styles.reminderEntry}
            onClick={() => Taro.navigateTo({ url: '/pages/reminder-center/index' })}
          >
            <Text className={styles.reminderIcon}>🔔</Text>
            {unreadCount > 0 && (
              <View className={styles.reminderBadge}><Text>{unreadCount > 99 ? '99+' : unreadCount}</Text></View>
            )}
          </View>
        </View>
        
        <View className={styles.filterBar}>
          <Picker range={memberPickerList} onChange={handleMemberPickerChange}>
            <View className={classnames(styles.filterChip, filterMemberId && styles.filterChipActive)}>
              <Text>{filterMemberId ? members.find(m => m.id === filterMemberId)?.name : '全部成员'}</Text>
              <Text className={styles.filterArrow}>▼</Text>
            </View>
          </Picker>
          <Picker range={goalPickerList} onChange={handleGoalPickerChange}>
            <View className={classnames(styles.filterChip, filterGoalId && styles.filterChipActive)}>
              <Text>{filterGoalId ? goals.find(g => g.id === filterGoalId)?.title : '全部目标'}</Text>
              <Text className={styles.filterArrow}>▼</Text>
            </View>
          </Picker>
        </View>
        
        <View className={styles.weekDays}>
          {weekDays.map(day => <Text key={day} className={styles.weekDay}>{day}</Text>)}
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
          <Text className={styles.dateText}>{selectedDate.format('MM月DD日 dddd')}</Text>
          <Text className={styles.scheduleCount}>共 {selectedDateSchedules.length} 项安排</Text>
        </View>
        
        {hasConflict && (
          <View className={styles.conflictWarning}>
            <Text className={styles.warningIcon}>⚠️</Text>
            <Text className={styles.warningText}>今日存在日程冲突，请合理安排时间</Text>
          </View>
        )}
        
        <View className={styles.scheduleList}>
          {selectedDateSchedules.map(schedule => (
            <View
              key={schedule.id}
              className={classnames(styles.scheduleItem, (schedule.goalId || schedule.taskId) && styles.scheduleClickable)}
              onClick={() => handleScheduleClick(schedule)}
            >
              <View className={classnames(styles.typeIcon, styles[schedule.type])}>
                <Text>{getTypeIcon(schedule.type)}</Text>
              </View>
              
              <View className={styles.scheduleContent}>
                <View className={styles.scheduleTitleRow}>
                  <Text className={styles.scheduleTitle}>{schedule.title}</Text>
                  <Text className={classnames(styles.typeTag, styles[`typeTag_${schedule.type}`])}>
                    {getTypeLabel(schedule.type)}
                  </Text>
                </View>
                <Text className={styles.scheduleTime}>{schedule.time || '全天'}</Text>
                {schedule.goalId && (
                  <Text className={styles.scheduleGoal}>📋 {getGoalTitle(schedule.goalId)}</Text>
                )}
                {schedule.taskId && (
                  <Text className={styles.scheduleTask}>👤 {getTaskAssignee(schedule.goalId, schedule.taskId)}</Text>
                )}
              </View>
              
              {schedule.conflict && (
                <View className={styles.conflictBadge}>冲突</View>
              )}
              
              {(schedule.goalId || schedule.taskId) && (
                <Text className={styles.scheduleArrow}>›</Text>
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
