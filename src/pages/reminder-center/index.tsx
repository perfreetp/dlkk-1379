import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { useGoalStore } from '@/store/useGoalStore';
import type { Schedule } from '@/types';

type FilterType = 'unread' | 'today' | 'week' | 'conflict' | 'all';

const filters: Array<{ key: FilterType; label: string }> = [
  { key: 'unread', label: '未读' },
  { key: 'today', label: '今天' },
  { key: 'week', label: '本周' },
  { key: 'conflict', label: '冲突' },
  { key: 'all', label: '全部' }
];

const ReminderCenterPage: React.FC = () => {
  const {
    getReminders,
    getUnreadCount,
    markReminderRead,
    markAllRemindersRead,
    snoozeReminder,
    toggleReminderEnabled,
    lastReminderFilter,
    setLastReminderFilter,
    getGoalById,
    getMemberById
  } = useGoalStore();

  const [activeFilter, setActiveFilter] = useState<FilterType>(
    (lastReminderFilter as FilterType) || 'unread'
  );

  const reminders = getReminders(activeFilter);
  const unreadCount = getUnreadCount();

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setLastReminderFilter(filter);
  };

  const handleReminderClick = (reminder: Schedule) => {
    if (!reminder.read) {
      markReminderRead(reminder.id, true);
    }
    if (reminder.taskId) {
      Taro.navigateTo({
        url: `/pages/goal-detail/index?id=${reminder.goalId}&tab=tasks&taskId=${reminder.taskId}`
      });
    } else if (reminder.goalId) {
      Taro.navigateTo({
        url: `/pages/goal-detail/index?id=${reminder.goalId}`
      });
    }
  };

  const handleMarkAllRead = () => {
    if (unreadCount === 0) {
      Taro.showToast({ title: '暂无未读提醒', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '全部已读',
      content: '确定要将所有提醒标记为已读吗？',
      success: (res) => {
        if (res.confirm) {
          markAllRemindersRead();
          Taro.showToast({ title: '已全部标记为已读', icon: 'success' });
        }
      }
    });
  };

  const handleSnooze = (reminder: Schedule, days: number) => {
    const untilDate = dayjs().add(days, 'day').format('YYYY-MM-DD');
    snoozeReminder(reminder.id, untilDate);
    markReminderRead(reminder.id, false);
    Taro.showToast({ title: `已推迟${days}天`, icon: 'success' });
  };

  const handleToggleRemind = (reminder: Schedule) => {
    const newEnabled = !reminder.remindEnabled;
    toggleReminderEnabled(reminder.id, newEnabled);
    Taro.showToast({
      title: newEnabled ? '已开启提醒' : '已关闭提醒',
      icon: 'success'
    });
  };

  const getGoalTitle = (goalId?: string) => {
    if (!goalId) return '';
    return getGoalById(goalId)?.title || '';
  };

  const getTaskAssignee = (goalId?: string, taskId?: string) => {
    if (!goalId || !taskId) return '';
    const goal = getGoalById(goalId);
    const task = goal?.tasks.find(t => t.id === taskId);
    if (!task) return '';
    return getMemberById(task.assigneeId)?.name || '';
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

  const formatDate = (dateStr: string) => {
    const date = dayjs(dateStr);
    if (date.isSame(dayjs(), 'day')) return '今天';
    if (date.isSame(dayjs().add(1, 'day'), 'day')) return '明天';
    return date.format('MM月DD日');
  };

  return (
    <ScrollView className={styles.reminderPage} scrollY>
      <View className={styles.header}>
        <View className={styles.headerTop}>
          <Text className={styles.headerTitle}>提醒中心</Text>
          <Text className={styles.markAllBtn} onClick={handleMarkAllRead}>全部已读</Text>
        </View>
        <View className={styles.unreadSummary}>
          <Text className={styles.unreadCount}>{unreadCount}</Text>
          <Text className={styles.unreadLabel}>条未读提醒</Text>
        </View>
      </View>

      <View className={styles.filterBar}>
        {filters.map(filter => (
          <View
            key={filter.key}
            className={classnames(styles.filterItem, activeFilter === filter.key && styles.filterItemActive)}
            onClick={() => handleFilterChange(filter.key)}
          >
            <Text className={classnames(styles.filterText, activeFilter === filter.key && styles.filterTextActive)}>
              {filter.label}
            </Text>
          </View>
        ))}
      </View>

      <View className={styles.reminderList}>
        {reminders.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>🔔</Text>
            <Text className={styles.emptyText}>暂无{filters.find(f => f.key === activeFilter)?.label}提醒</Text>
          </View>
        ) : (
          reminders.map(reminder => (
            <View
              key={reminder.id}
              className={classnames(
                styles.reminderItem,
                reminder.read && styles.reminderRead,
                reminder.conflict && styles.reminderConflict
              )}
            >
              <View className={styles.reminderMain} onClick={() => handleReminderClick(reminder)}>
                <View className={classnames(styles.typeIcon, styles[reminder.type])}>
                  <Text>{getTypeIcon(reminder.type)}</Text>
                </View>

                <View className={styles.reminderContent}>
                  <View className={styles.reminderHeader}>
                    <Text className={styles.reminderTitle}>{reminder.title}</Text>
                    {!reminder.read && <View className={styles.unreadDot}></View>}
                  </View>
                  <View className={styles.reminderMeta}>
                    <Text className={styles.reminderDate}>📅 {formatDate(reminder.date)}</Text>
                    <Text className={classnames(styles.typeTag, styles[`typeTag_${reminder.type}`])}>
                      {getTypeLabel(reminder.type)}
                    </Text>
                  </View>
                  {reminder.goalId && (
                    <Text className={styles.reminderGoal}>📋 {getGoalTitle(reminder.goalId)}</Text>
                  )}
                  {reminder.taskId && (
                    <Text className={styles.reminderAssignee}>👤 {getTaskAssignee(reminder.goalId, reminder.taskId)}</Text>
                  )}
                  {reminder.conflict && (
                    <View className={styles.conflictBadge}>
                      <Text>⚠️ 日程冲突</Text>
                    </View>
                  )}
                </View>

                <Text className={styles.reminderArrow}>›</Text>
              </View>

              <View className={styles.reminderActions}>
                <View
                  className={styles.actionBtn}
                  onClick={(e) => { e.stopPropagation(); handleSnooze(reminder, 1); }}
                >
                  <Text className={styles.actionIcon}>⏰</Text>
                  <Text className={styles.actionText}>明天再提</Text>
                </View>
                <View
                  className={styles.actionBtn}
                  onClick={(e) => { e.stopPropagation(); handleSnooze(reminder, 7); }}
                >
                  <Text className={styles.actionIcon}>📆</Text>
                  <Text className={styles.actionText}>下周再提</Text>
                </View>
                <View
                  className={classnames(styles.actionBtn, !reminder.remindEnabled && styles.actionBtnActive)}
                  onClick={(e) => { e.stopPropagation(); handleToggleRemind(reminder); }}
                >
                  <Text className={styles.actionIcon}>{reminder.remindEnabled ? '🔕' : '🔔'}</Text>
                  <Text className={styles.actionText}>{reminder.remindEnabled ? '关闭提醒' : '开启提醒'}</Text>
                </View>
                <View
                  className={styles.actionBtn}
                  onClick={(e) => { e.stopPropagation(); markReminderRead(reminder.id, !reminder.read); }}
                >
                  <Text className={styles.actionIcon}>✓</Text>
                  <Text className={styles.actionText}>{reminder.read ? '标为未读' : '标为已读'}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default ReminderCenterPage;
