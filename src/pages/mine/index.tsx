import React, { useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useGoalStore } from '@/store/useGoalStore';
import { memberAvatarById } from '@/data/mockData';

const roleLabels: Record<string, string> = {
  owner: '管理员',
  member: '成员',
  viewer: '只读访客'
};

const MinePage: React.FC = () => {
  const {
    goals,
    members,
    currentUserId,
    getMemberById,
    getGoalsByMember,
    handleExport,
    resetToMockData,
    switchUser
  } = useGoalStore();

  const currentUser = getMemberById(currentUserId);

  const myStats = useMemo(() => {
    const myGoals = getGoalsByMember(currentUserId);
    const myTasks = myGoals.flatMap(g => g.tasks).filter(t => t.assigneeId === currentUserId);
    const completedTasks = myTasks.filter(t => t.status === 'completed');
    const myRewards = myGoals.flatMap(g => g.rewards).filter(r => r.achieved);

    return {
      goals: myGoals.length,
      tasks: completedTasks.length,
      rewards: myRewards.length
    };
  }, [goals, currentUserId]);

  const memberScores = useMemo(() => {
    return members.map(member => {
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

      return { member, score };
    }).sort((a, b) => b.score - a.score);
  }, [goals, members]);

  const handleResetData = () => {
    Taro.showModal({
      title: '重置数据',
      content: '确定要清空所有数据并恢复到示例数据吗？此操作不可撤销。',
      confirmColor: '#F53F3F',
      success: (res) => {
        if (res.confirm) {
          resetToMockData();
          Taro.showToast({ title: '已重置为示例数据', icon: 'success' });
        }
      }
    });
  };

  const handleSwitchUser = (userId: string) => {
    if (userId === currentUserId) return;
    const targetMember = getMemberById(userId);
    switchUser(userId);
    Taro.showToast({
      title: `已切换为${targetMember?.name || '用户'}`,
      icon: 'success'
    });
  };

  const handleGoToReview = () => {
    const completedGoals = goals.filter(g => g.status === 'completed');
    if (completedGoals.length > 0) {
      Taro.navigateTo({ url: `/pages/review/index?id=${completedGoals[0].id}` });
    } else {
      Taro.showToast({ title: '暂无已完成目标', icon: 'none' });
    }
  };

  const menuItems = [
    { icon: '📊', iconClass: 'primary', title: '导出目标清单', onClick: handleExport },
    { icon: '📝', iconClass: 'success', title: '复盘总结', onClick: handleGoToReview },
    { icon: '🔔', iconClass: 'warning', title: '提醒中心', onClick: () => Taro.navigateTo({ url: '/pages/reminder-center/index' }) },
    { icon: '🔄', iconClass: 'danger', title: '重置为示例数据', onClick: handleResetData }
  ];

  return (
    <ScrollView className={styles.minePage} scrollY>
      <View className={styles.profileHeader}>
        <View className={styles.profileInfo}>
          <Image
            className={styles.avatar}
            src={currentUser ? memberAvatarById(currentUser.id) : 'https://picsum.photos/200/200'}
            mode='aspectFill'
          />
          <View className={styles.userInfo}>
            <Text className={styles.userName}>{currentUser?.name || '用户'}</Text>
            <Text className={classnames(styles.userRole, styles[`role_${currentUser?.role}`])}>
              {roleLabels[currentUser?.role || 'member']}
            </Text>
          </View>
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{myStats.goals}</Text>
            <Text className={styles.statLabel}>参与目标</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{myStats.tasks}</Text>
            <Text className={styles.statLabel}>完成任务</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{myStats.rewards}</Text>
            <Text className={styles.statLabel}>获得奖励</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.switchSection}>
          <Text className={styles.sectionTitle}>切换身份</Text>
          <Text className={styles.switchHint}>切换后，目标列表和编辑权限将按新身份显示</Text>
          <View className={styles.switchList}>
            {members.map(member => (
              <View
                key={member.id}
                className={classnames(styles.switchItem, member.id === currentUserId && styles.switchItemActive)}
                onClick={() => handleSwitchUser(member.id)}
              >
                <Image
                  className={styles.switchAvatar}
                  src={memberAvatarById(member.id)}
                  mode='aspectFill'
                />
                <View className={styles.switchInfo}>
                  <Text className={classnames(styles.switchName, member.id === currentUserId && styles.switchNameActive)}>
                    {member.name}
                  </Text>
                  <Text className={classnames(styles.switchRole, styles[`switchRole_${member.role}`])}>
                    {roleLabels[member.role]}
                  </Text>
                </View>
                {member.id === currentUserId && (
                  <View className={styles.currentBadge}><Text>当前</Text></View>
                )}
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          {menuItems.map((item, index) => (
            <View key={index} className={styles.menuItem} onClick={item.onClick}>
              <View className={classnames(styles.menuIcon, styles[item.iconClass])}>
                <Text>{item.icon}</Text>
              </View>
              <View className={styles.menuContent}>
                <Text className={styles.menuTitle}>{item.title}</Text>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>
          ))}
        </View>

        <View className={styles.familySection}>
          <Text className={styles.sectionTitle}>家庭成员</Text>

          <View className={styles.familyMembers}>
            {memberScores.map(({ member, score }) => (
              <View key={member.id} className={styles.memberItem}>
                <Image
                  className={styles.avatar}
                  src={memberAvatarById(member.id)}
                  mode='aspectFill'
                />
                <View className={styles.memberInfo}>
                  <Text className={styles.memberName}>{member.name}</Text>
                  <Text className={classnames(styles.memberRole, styles[`memberRole_${member.role}`])}>
                    {roleLabels[member.role]}
                  </Text>
                </View>
                <View className={styles.memberScore}>
                  <Text className={styles.scoreValue}>{score}</Text>
                  <Text className={styles.scoreLabel}>积分</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default MinePage;
