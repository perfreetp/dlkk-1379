import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useGoalStore } from '@/store/useGoalStore';
import GoalCard from '@/components/GoalCard';
import type { GoalCategory, GoalStatus } from '@/types';

const categories: Array<{ key: GoalCategory | 'all'; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'travel', label: '旅行' },
  { key: 'saving', label: '储蓄' },
  { key: 'organizing', label: '整理' },
  { key: 'health', label: '健康' },
  { key: 'study', label: '学习' },
  { key: 'other', label: '其他' }
];

const statuses: Array<{ key: GoalStatus | 'all'; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'in_progress', label: '进行中' },
  { key: 'planning', label: '计划中' },
  { key: 'completed', label: '已完成' }
];

const GoalsPage: React.FC = () => {
  const { goals, currentUserId, getGoalsByMember } = useGoalStore();
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<GoalStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  
  const filteredGoals = useMemo(() => {
    let result = getGoalsByMember(currentUserId);
    
    if (selectedCategory !== 'all') {
      result = result.filter(g => g.category === selectedCategory);
    }
    
    if (selectedStatus !== 'all') {
      result = result.filter(g => g.status === selectedStatus);
    }
    
    return result.sort((a, b) => {
      const statusOrder = { planning: 0, in_progress: 1, completed: 2, cancelled: 3 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [goals, selectedCategory, selectedStatus, currentUserId]);
  
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
      console.log('[GoalsPage] Pull down refresh completed');
    }, 1000);
  };
  
  const handleCreateGoal = () => {
    Taro.navigateTo({ url: '/pages/goal-create/index' });
  };
  
  return (
    <View className={styles.goalsPage}>
      <View className={styles.filterBar}>
        <ScrollView 
          className={styles.categoryScroll} 
          scrollX
          enhanced
          showScrollbar={false}
        >
          {categories.map(cat => (
            <View
              key={cat.key}
              className={classnames(styles.categoryItem, selectedCategory === cat.key && styles.active)}
              onClick={() => setSelectedCategory(cat.key)}
            >
              <Text>{cat.label}</Text>
            </View>
          ))}
        </ScrollView>
        
        <View className={styles.statusTabs}>
          {statuses.map(stat => (
            <View
              key={stat.key}
              className={classnames(styles.tabItem, selectedStatus === stat.key && styles.active)}
              onClick={() => setSelectedStatus(stat.key)}
            >
              <Text>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <ScrollView
        className={styles.content}
        scrollY
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}
      >
        <View className={styles.goalsList}>
          {filteredGoals.map(goal => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
          
          {filteredGoals.length === 0 && (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📋</Text>
              <Text className={styles.emptyText}>暂无符合条件的目标</Text>
              <Button 
                className='btnPrimary'
                style={{ marginTop: '24rpx' }}
                onClick={handleCreateGoal}
              >
                创建新目标
              </Button>
            </View>
          )}
        </View>
      </ScrollView>
      
      <View className={styles.createButton} onClick={handleCreateGoal}>
        <Text className={styles.plusIcon}>+</Text>
      </View>
    </View>
  );
};

export default GoalsPage;
