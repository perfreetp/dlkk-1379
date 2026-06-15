import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { Goal } from '@/types';
import { categoryLabels, statusLabels, categoryColors, memberAvatarById } from '@/data/mockData';
import { useGoalStore } from '@/store/useGoalStore';

interface GoalCardProps {
  goal: Goal;
  onClick?: () => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onClick }) => {
  const getMemberById = useGoalStore(state => state.getMemberById);
  
  const getStatusTagClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'tagSuccess';
      case 'in_progress':
        return 'tagPrimary';
      case 'planning':
        return 'tagWarning';
      default:
        return 'tagError';
    }
  };
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/goal-detail/index?id=${goal.id}`
      });
    }
  };
  
  const visibleMembers = goal.visibleMemberIds
    .map(id => getMemberById(id))
    .filter(Boolean);
  
  const isOverBudget = goal.usedBudget > goal.budget;
  
  return (
    <View 
      className={classnames(styles.goalCard, goal.status === 'completed' && styles.completed)}
      onClick={handleClick}
    >
      <View className={styles.cardHeader}>
        <View className={styles.titleSection}>
          <Text className={styles.title}>{goal.title}</Text>
          <View className={classnames('tag', 'tagPrimary', styles.category)}>
            {categoryLabels[goal.category]}
          </View>
        </View>
        <View className={classnames('tag', getStatusTagClass(goal.status), styles.statusBadge)}>
          {statusLabels[goal.status]}
        </View>
      </View>
      
      <Text className={styles.description}>{goal.description}</Text>
      
      <View className={styles.progressSection}>
        <View className={styles.progressHeader}>
          <Text className={styles.progressLabel}>完成进度</Text>
          <Text className={styles.progressValue}>{goal.progress}%</Text>
        </View>
        <View className={classnames('progressBar', goal.status === 'completed' && 'success')}>
          <View className='progressFill' style={{ width: `${goal.progress}%` }}></View>
        </View>
      </View>
      
      <View className={styles.metaSection}>
        <View className={styles.budgetSection}>
          <Text className={styles.budgetLabel}>预算</Text>
          <Text className={classnames(styles.budgetValue, isOverBudget && 'tagError')}>
            ¥{goal.usedBudget.toLocaleString()} / ¥{goal.budget.toLocaleString()}
          </Text>
        </View>
        
        <View className={styles.membersSection}>
          <View className={styles.avatarGroup}>
            {visibleMembers.slice(0, 3).map((member, index) => (
              member && (
                <Image
                  key={index}
                  className={styles.avatar}
                  src={memberAvatarById(member.id)}
                  mode='aspectFill'
                />
              )
            ))}
            {visibleMembers.length > 3 && (
              <View className={styles.avatar}>
                <Text>+{visibleMembers.length - 3}</Text>
              </View>
            )}
          </View>
          <Text className={styles.deadline}>截止 {goal.deadline}</Text>
        </View>
      </View>
    </View>
  );
};

export default GoalCard;
