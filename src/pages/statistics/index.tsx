import React, { useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useGoalStore } from '@/store/useGoalStore';
import { categoryLabels, memberAvatarById } from '@/data/mockData';
import type { Member, Contribution } from '@/types';

const StatisticsPage: React.FC = () => {
  const { goals, members, getGoalsByMember } = useGoalStore();
  
  const overviewStats = useMemo(() => {
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const totalBudget = goals.reduce((sum, g) => sum + g.budget, 0);
    const totalSpent = goals.reduce((sum, g) => sum + g.usedBudget, 0);
    
    return { totalGoals, completedGoals, totalBudget, totalSpent };
  }, [goals]);
  
  const memberContributions = useMemo(() => {
    const contributions: Array<{ member: Member; contribution: Contribution }> = [];
    
    members.forEach(member => {
      const memberGoals = getGoalsByMember(member.id);
      const allTasks = memberGoals.flatMap(g => g.tasks);
      const memberTasks = allTasks.filter(t => t.assigneeId === member.id);
      const completedTasks = memberTasks.filter(t => t.status === 'completed');
      const allExpenses = memberGoals.flatMap(g => g.expenses);
      const memberExpenses = allExpenses.filter(e => e.payerId === member.id);
      const totalExpenses = memberExpenses.reduce((sum, e) => sum + e.amount, 0);
      const allComments = memberGoals.flatMap(g => g.comments);
      const memberComments = allComments.filter(c => c.authorId === member.id);
      
      const score = 
        completedTasks.length * 10 + 
        Math.floor(totalExpenses / 100) * 5 + 
        memberComments.length * 2;
      
      contributions.push({
        member,
        contribution: {
          memberId: member.id,
          completedTasks: completedTasks.length,
          totalTasks: memberTasks.length,
          expensesPaid: totalExpenses,
          commentsCount: memberComments.length,
          score
        }
      });
    });
    
    return contributions.sort((a, b) => b.contribution.score - a.contribution.score);
  }, [goals, members]);
  
  const categoryStats = useMemo(() => {
    const categories = ['travel', 'saving', 'organizing', 'health', 'study', 'other'];
    const icons: Record<string, string> = {
      travel: '✈️',
      saving: '💰',
      organizing: '🧹',
      health: '💪',
      study: '📚',
      other: '📌'
    };
    
    return categories.map(cat => ({
      key: cat,
      name: categoryLabels[cat],
      icon: icons[cat],
      count: goals.filter(g => g.category === cat).length
    })).filter(c => c.count > 0);
  }, [goals]);
  
  const goalProgress = useMemo(() => {
    return goals
      .filter(g => g.status !== 'cancelled')
      .slice(0, 5)
      .map(g => ({
        id: g.id,
        title: g.title,
        progress: g.progress
      }));
  }, [goals]);
  
  const getRankClass = (index: number) => {
    if (index === 0) return 'rank1';
    if (index === 1) return 'rank2';
    if (index === 2) return 'rank3';
    return 'other';
  };
  
  const handleExport = () => {
    const csvContent = useGoalStore.getState().exportGoals();
    console.log('[StatisticsPage] Exported goals CSV');
    Taro.showToast({
      title: '导出成功',
      icon: 'success'
    });
  };
  
  return (
    <ScrollView className={styles.statisticsPage} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>家庭贡献统计</Text>
        
        <View className={styles.overviewGrid}>
          <View className={styles.overviewCard}>
            <Text className={styles.cardValue}>{overviewStats.totalGoals}</Text>
            <Text className={styles.cardLabel}>总目标数</Text>
          </View>
          <View className={styles.overviewCard}>
            <Text className={styles.cardValue}>{overviewStats.completedGoals}</Text>
            <Text className={styles.cardLabel}>已完成</Text>
          </View>
          <View className={styles.overviewCard}>
            <Text className={styles.cardValue}>¥{overviewStats.totalBudget.toLocaleString()}</Text>
            <Text className={styles.cardLabel}>总预算</Text>
          </View>
          <View className={styles.overviewCard}>
            <Text className={styles.cardValue}>¥{overviewStats.totalSpent.toLocaleString()}</Text>
            <Text className={styles.cardLabel}>已花费</Text>
          </View>
        </View>
      </View>
      
      <View className={styles.content}>
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>贡献排行榜</Text>
            <Text className='tag tagPrimary' onClick={handleExport}>导出清单</Text>
          </View>
          
          <View className={styles.rankingCard}>
            {memberContributions.map(({ member, contribution }, index) => (
              <View key={member.id} className={styles.rankItem}>
                <View className={classnames(styles.rankNumber, styles[getRankClass(index)])}>
                  <Text>{index + 1}</Text>
                </View>
                
                <Image 
                  className={styles.avatar}
                  src={memberAvatarById(member.id)}
                  mode='aspectFill'
                />
                
                <View className={styles.memberInfo}>
                  <Text className={styles.memberName}>{member.name}</Text>
                  <View className={styles.memberStats}>
                    <Text className={styles.stat}>
                      <Text className={styles.statValue}>{contribution.completedTasks}</Text>任务
                    </Text>
                    <Text className={styles.stat}>
                      <Text className={styles.statValue}>¥{contribution.expensesPaid.toLocaleString()}</Text>支出
                    </Text>
                    <Text className={styles.stat}>
                      <Text className={styles.statValue}>{contribution.commentsCount}</Text>评论
                    </Text>
                  </View>
                </View>
                
                <View className={styles.score}>
                  <Text className={styles.scoreValue}>{contribution.score}</Text>
                  <Text className={styles.scoreLabel}>积分</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
        
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>目标分类统计</Text>
          </View>
          
          <View className={styles.categoryStats}>
            <View className={styles.statsGrid}>
              {categoryStats.map(cat => (
                <View key={cat.key} className={styles.statCard}>
                  <View className={styles.categoryIcon}>
                    <Text>{cat.icon}</Text>
                  </View>
                  <Text className={styles.categoryName}>{cat.name}</Text>
                  <Text className={styles.categoryCount}>{cat.count}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>目标进度</Text>
          </View>
          
          <View className={styles.progressChart}>
            <Text className={styles.chartTitle}>主要目标完成情况</Text>
            
            {goalProgress.map(goal => (
              <View key={goal.id} className={styles.progressItem}>
                <View className={styles.progressHeader}>
                  <Text className={styles.progressLabel}>{goal.title}</Text>
                  <Text className={styles.progressValue}>{goal.progress}%</Text>
                </View>
                <View className={classnames('progressBar', goal.progress === 100 && 'success')}>
                  <View className='progressFill' style={{ width: `${goal.progress}%` }}></View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default StatisticsPage;
