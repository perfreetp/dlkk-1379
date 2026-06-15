import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { useGoalStore } from '@/store/useGoalStore';
import GoalCard from '@/components/GoalCard';
import TaskItem from '@/components/TaskItem';

const HomePage: React.FC = () => {
  const { 
    goals, 
    currentUserId, 
    getMemberById, 
    getGoalsByStatus, 
    getGoalsByMember,
    toggleTaskStatus,
    schedules
  } = useGoalStore();
  
  const [refreshing, setRefreshing] = useState(false);
  
  const currentUser = getMemberById(currentUserId);
  
  const inProgressGoals = useMemo(() => {
    return getGoalsByStatus('in_progress').slice(0, 3);
  }, [goals]);
  
  const todayTasks = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    const myGoals = getGoalsByMember(currentUserId);
    const tasks: Array<{ task: any; goalId: string }> = [];
    
    myGoals.forEach(goal => {
      goal.tasks.forEach(task => {
        if (task.assigneeId === currentUserId && task.status !== 'completed') {
          if (task.deadline === today || dayjs(task.deadline).diff(dayjs(), 'day') <= 3) {
            tasks.push({ task, goalId: goal.id });
          }
        }
      });
    });
    
    return tasks.slice(0, 5);
  }, [goals, currentUserId]);
  
  const stats = useMemo(() => {
    const myGoals = getGoalsByMember(currentUserId);
    const myTasks = myGoals.flatMap(g => g.tasks).filter(t => t.assigneeId === currentUserId);
    const completedTasks = myTasks.filter(t => t.status === 'completed');
    const todaySchedules = schedules.filter(s => s.date === dayjs().format('YYYY-MM-DD'));
    
    return {
      totalGoals: myGoals.length,
      inProgress: getGoalsByStatus('in_progress').filter(g => g.visibleMemberIds.includes(currentUserId)).length,
      completedTasks: completedTasks.length,
      todayReminders: todaySchedules.length
    };
  }, [goals, schedules, currentUserId]);
  
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
      console.log('[HomePage] Pull down refresh completed');
    }, 1000);
  };
  
  const handleCreateGoal = () => {
    Taro.navigateTo({ url: '/pages/goal-create/index' });
  };
  
  const handleViewAllGoals = () => {
    Taro.switchTab({ url: '/pages/goals/index' });
  };
  
  const handleViewSchedule = () => {
    Taro.switchTab({ url: '/pages/schedule/index' });
  };
  
  const handleViewStatistics = () => {
    Taro.switchTab({ url: '/pages/statistics/index' });
  };
  
  const greeting = () => {
    const hour = dayjs().hour();
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };
  
  return (
    <ScrollView
      className={styles.homePage}
      scrollY
      refresherEnabled
      refresherTriggered={refreshing}
      onRefresherRefresh={handleRefresh}
    >
      <View className={styles.header}>
        <View className={styles.welcomeSection}>
          <Text className={styles.greeting}>{greeting()}，{currentUser?.name}！</Text>
          <Text className={styles.date}>{dayjs().format('YYYY年MM月DD日 dddd')}</Text>
        </View>
        
        <View className={styles.statsGrid}>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{stats.totalGoals}</Text>
            <Text className={styles.statLabel}>参与目标</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{stats.inProgress}</Text>
            <Text className={styles.statLabel}>进行中</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{stats.completedTasks}</Text>
            <Text className={styles.statLabel}>已完成</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{stats.todayReminders}</Text>
            <Text className={styles.statLabel}>今日提醒</Text>
          </View>
        </View>
      </View>
      
      <View className={styles.content}>
        <View className={styles.quickActions}>
          <View className={styles.actionCard} onClick={handleCreateGoal}>
            <View className={`${styles.actionIcon} ${styles.primary}`}>
              <Text>➕</Text>
            </View>
            <Text className={styles.actionText}>创建目标</Text>
          </View>
          <View className={styles.actionCard} onClick={handleViewSchedule}>
            <View className={`${styles.actionIcon} ${styles.warning}`}>
              <Text>📅</Text>
            </View>
            <Text className={styles.actionText}>日程安排</Text>
          </View>
          <View className={styles.actionCard} onClick={handleViewStatistics}>
            <View className={`${styles.actionIcon} ${styles.success}`}>
              <Text>📊</Text>
            </View>
            <Text className={styles.actionText}>数据统计</Text>
          </View>
        </View>
        
        <View className={styles.inProgressGoals}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>进行中的目标</Text>
            <Text className={styles.seeMore} onClick={handleViewAllGoals}>查看全部</Text>
          </View>
          
          <View className={styles.goalsList}>
            {inProgressGoals.map(goal => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
            
            {inProgressGoals.length === 0 && (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>🎯</Text>
                <Text className={styles.emptyText}>暂无进行中的目标</Text>
                <Button 
                  className='btnPrimary'
                  style={{ marginTop: '24rpx' }}
                  onClick={handleCreateGoal}
                >
                  创建第一个目标
                </Button>
              </View>
            )}
          </View>
        </View>
        
        <View className={styles.todayTasks}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>我的待办任务</Text>
            <Text className={styles.seeMore} onClick={handleViewSchedule}>查看全部</Text>
          </View>
          
          <View className={styles.tasksList}>
            {todayTasks.map(({ task, goalId }) => (
              <TaskItem
                key={task.id}
                task={task}
                goalId={goalId}
                onToggle={() => toggleTaskStatus(goalId, task.id)}
              />
            ))}
            
            {todayTasks.length === 0 && (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>✅</Text>
                <Text className={styles.emptyText}>太棒了！暂无待办任务</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default HomePage;
