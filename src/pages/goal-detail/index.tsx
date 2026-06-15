import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Image, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useGoalStore } from '@/store/useGoalStore';
import TaskItem from '@/components/TaskItem';
import { categoryLabels, statusLabels, memberNameById, memberAvatarById } from '@/data/mockData';
import type { Reward } from '@/types';

const GoalDetailPage: React.FC = () => {
  const router = useRouter();
  const goalId = router.params.id as string;
  
  const { 
    goals, 
    currentUserId,
    getGoalById, 
    getMemberById,
    toggleTaskStatus,
    addComment,
    addReward,
    updateReward,
    deleteReward,
    toggleRewardAchieved
  } = useGoalStore();
  
  const [activeTab, setActiveTab] = useState<'tasks' | 'info' | 'expense' | 'reward' | 'comment'>('tasks');
  const [commentText, setCommentText] = useState('');
  
  const [rewardModalVisible, setRewardModalVisible] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardCondition, setRewardCondition] = useState('');
  const [rewardDescription, setRewardDescription] = useState('');
  
  const goal = useMemo(() => {
    return getGoalById(goalId);
  }, [goals, goalId]);
  
  const tabs = [
    { key: 'tasks', label: '任务' },
    { key: 'info', label: '信息' },
    { key: 'expense', label: '费用' },
    { key: 'reward', label: '奖励' },
    { key: 'comment', label: '评论' }
  ];
  
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
  
  const handleAddTask = () => {
    Taro.navigateTo({
      url: `/pages/task-assign/index?goalId=${goalId}`
    });
  };
  
  const handleAddExpense = () => {
    Taro.navigateTo({
      url: `/pages/expense-record/index?goalId=${goalId}`
    });
  };
  
  const handleAddReward = () => {
    setEditingReward(null);
    setRewardTitle('');
    setRewardCondition('');
    setRewardDescription('');
    setRewardModalVisible(true);
  };
  
  const handleEditReward = (reward: Reward) => {
    setEditingReward(reward);
    setRewardTitle(reward.title);
    setRewardCondition(reward.condition);
    setRewardDescription(reward.description || '');
    setRewardModalVisible(true);
  };
  
  const handleDeleteReward = (rewardId: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个奖励吗？',
      success: (res) => {
        if (res.confirm) {
          deleteReward(goalId, rewardId);
          Taro.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  };
  
  const handleSaveReward = () => {
    if (!rewardTitle.trim()) {
      Taro.showToast({ title: '请输入奖励名称', icon: 'none' });
      return;
    }
    if (!rewardCondition.trim()) {
      Taro.showToast({ title: '请输入达成条件', icon: 'none' });
      return;
    }
    
    if (editingReward) {
      updateReward(goalId, editingReward.id, {
        title: rewardTitle.trim(),
        condition: rewardCondition.trim(),
        description: rewardDescription.trim() || undefined
      });
      Taro.showToast({ title: '已更新', icon: 'success' });
    } else {
      addReward(goalId, {
        title: rewardTitle.trim(),
        condition: rewardCondition.trim(),
        description: rewardDescription.trim() || undefined,
        achieved: false
      });
      Taro.showToast({ title: '添加成功', icon: 'success' });
    }
    
    setRewardModalVisible(false);
  };
  
  const handleSendComment = () => {
    if (!commentText.trim()) return;
    
    addComment(goalId, {
      authorId: currentUserId,
      content: commentText.trim()
    });
    
    setCommentText('');
    Taro.showToast({
      title: '评论成功',
      icon: 'success'
    });
  };
  
  const handleToggleReward = (rewardId: string) => {
    toggleRewardAchieved(goalId, rewardId);
  };
  
  const handleCompleteGoal = () => {
    Taro.showModal({
      title: '确认完成',
      content: '确定要标记这个目标为已完成吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.navigateTo({
            url: `/pages/review/index?id=${goalId}`
          });
        }
      }
    });
  };
  
  const handleEditGoal = () => {
    Taro.navigateTo({
      url: `/pages/goal-create/index?id=${goalId}`
    });
  };
  
  const _handleRemind = (memberId: string) => {
    const member = getMemberById(memberId);
    Taro.showToast({
      title: `已提醒${member?.name}`,
      icon: 'success'
    });
  };
  
  if (!goal) {
    return (
      <View className={styles.goalDetailPage}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>❓</Text>
          <Text className={styles.emptyText}>目标不存在</Text>
        </View>
      </View>
    );
  }
  
  const visibleMembers = goal.visibleMemberIds
    .map(id => getMemberById(id))
    .filter(Boolean);
  
  const remainingBudget = goal.budget - goal.usedBudget;
  const isOverBudget = remainingBudget < 0;
  
  return (
    <ScrollView className={styles.goalDetailPage} scrollY>
      <View className={styles.header}>
        <View className={styles.titleSection}>
          <Text className={styles.title}>{goal.title}</Text>
          <View className={classnames('tag', getStatusTagClass(goal.status), styles.statusBadge)}>
            {statusLabels[goal.status]}
          </View>
        </View>
        
        <Text className={styles.description}>{goal.description}</Text>
        
        <View className={styles.metaRow}>
          <View className={styles.metaItem}>
            <Text className={styles.metaIcon}>📅</Text>
            <Text>{goal.startDate} ~ {goal.deadline}</Text>
          </View>
          <View className={styles.metaItem}>
            <Text className={styles.metaIcon}>🏷️</Text>
            <Text>{categoryLabels[goal.category]}</Text>
          </View>
        </View>
        
        <View className={styles.progressSection}>
          <View className={styles.progressHeader}>
            <Text className={styles.progressLabel}>完成进度</Text>
            <Text className={styles.progressValue}>{goal.progress}%</Text>
          </View>
          <View className={classnames('progressBar', goal.progress === 100 && 'success')}>
            <View className='progressFill' style={{ width: `${goal.progress}%` }}></View>
          </View>
        </View>
      </View>
      
      <View className={styles.content}>
        <View className={styles.tabs}>
          {tabs.map(tab => (
            <View
              key={tab.key}
              className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
              onClick={() => setActiveTab(tab.key as any)}
            >
              <Text>{tab.label}</Text>
            </View>
          ))}
        </View>
        
        {activeTab === 'tasks' && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>
                任务列表 ({goal.tasks.filter(t => t.status === 'completed').length}/{goal.tasks.length})
              </Text>
              <Text className={styles.sectionAction} onClick={handleAddTask}>
                + 添加任务
              </Text>
            </View>
            
            <View>
              {goal.tasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  goalId={goal.id}
                  onToggle={() => toggleTaskStatus(goal.id, task.id)}
                />
              ))}
              
              {goal.tasks.length === 0 && (
                <View className={styles.emptyState}>
                  <Text className={styles.emptyIcon}>📋</Text>
                  <Text className={styles.emptyText}>暂无任务，点击上方添加</Text>
                </View>
              )}
            </View>
          </View>
        )}
        
        {activeTab === 'info' && (
          <View className={styles.section}>
            <View className={styles.infoCard}>
              <View className={styles.infoRow}>
                <Text className={styles.infoLabel}>分类</Text>
                <Text className={styles.infoValue}>{categoryLabels[goal.category]}</Text>
              </View>
              <View className={styles.infoRow}>
                <Text className={styles.infoLabel}>开始日期</Text>
                <Text className={styles.infoValue}>{goal.startDate}</Text>
              </View>
              <View className={styles.infoRow}>
                <Text className={styles.infoLabel}>截止日期</Text>
                <Text className={styles.infoValue}>{goal.deadline}</Text>
              </View>
              <View className={styles.infoRow}>
                <Text className={styles.infoLabel}>总预算</Text>
                <Text className={styles.infoValue}>¥{goal.budget.toLocaleString()}</Text>
              </View>
              <View className={styles.infoRow}>
                <Text className={styles.infoLabel}>完成标准</Text>
                <Text className={styles.infoValue}>{goal.completionCriteria}</Text>
              </View>
              <View className={styles.infoRow}>
                <Text className={styles.infoLabel}>创建人</Text>
                <Text className={styles.infoValue}>{memberNameById(goal.createdBy)}</Text>
              </View>
              <View className={styles.infoRow}>
                <Text className={styles.infoLabel}>可见成员</Text>
                <View className={styles.membersRow}>
                  <View className={styles.avatarGroup}>
                    {visibleMembers.map((member, index) => (
                      member && (
                        <Image
                          key={index}
                          className={styles.avatar}
                          src={memberAvatarById(member.id)}
                          mode='aspectFill'
                        />
                      )
                    ))}
                  </View>
                  <Text className={styles.infoValue}>{visibleMembers.length}人</Text>
                </View>
              </View>
            </View>
            
            {goal.review && (
              <View className={styles.reviewCard}>
                <View className={styles.reviewHeader}>
                  <Text className={styles.reviewIcon}>📝</Text>
                  <Text className={styles.reviewTitle}>复盘总结</Text>
                </View>
                <Text className={styles.reviewSummary}>{goal.review.summary}</Text>
                <View className={styles.reviewSection}>
                  <Text className={styles.sectionLabel}>亮点</Text>
                  <View className={styles.highlights}>
                    {goal.review.highlights.map((h, i) => (
                      <View key={i} className={classnames('tag', 'tagSuccess', styles.highlight)}>
                        {h}
                      </View>
                    ))}
                  </View>
                </View>
                <View className={styles.reviewSection}>
                  <Text className={styles.sectionLabel}>改进点</Text>
                  <View className={styles.improvements}>
                    {goal.review.improvements.map((im, i) => (
                      <View key={i} className={classnames('tag', 'tagWarning', styles.improvement)}>
                        {im}
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
        
        {activeTab === 'expense' && (
          <View className={styles.section}>
            <View className={styles.budgetCard}>
              <View className={styles.budgetHeader}>
                <Text className={styles.budgetTitle}>费用记录</Text>
                <Text className={styles.addExpense} onClick={handleAddExpense}>
                  + 记一笔
                </Text>
              </View>
              
              <View className={styles.budgetProgress}>
                <View className={styles.budgetAmount}>
                  <Text className={styles.spent}>¥{goal.usedBudget.toLocaleString()}</Text>
                  <Text className={styles.budgetLabel}>已花费</Text>
                </View>
                <View className={styles.remaining}>
                  <Text 
                    className={classnames(styles.remainingAmount, isOverBudget && 'tagError')}
                  >
                    {isOverBudget ? '-' : ''}¥{Math.abs(remainingBudget).toLocaleString()}
                  </Text>
                  <Text className={styles.remainingLabel}>
                    {isOverBudget ? '超支' : '剩余'}
                  </Text>
                </View>
              </View>
              
              <View className={classnames('progressBar', isOverBudget ? 'warning' : '')}>
                <View 
                  className='progressFill' 
                  style={{ width: `${Math.min((goal.usedBudget / goal.budget) * 100, 100)}%` }}
                ></View>
              </View>
              
              <View className={styles.expenseList}>
                {goal.expenses.map(expense => (
                  <View key={expense.id} className={styles.expenseItem}>
                    <View className={styles.expenseIcon}>
                      <Text>💳</Text>
                    </View>
                    <View className={styles.expenseInfo}>
                      <Text className={styles.expenseTitle}>{expense.title}</Text>
                      <Text className={styles.expenseMeta}>
                        {expense.date} · {memberNameById(expense.payerId)}支付
                      </Text>
                    </View>
                    <Text className={styles.expenseAmount}>
                      ¥{expense.amount.toLocaleString()}
                    </Text>
                  </View>
                ))}
                
                {goal.expenses.length === 0 && (
                  <View className={styles.emptyExpenses}>
                    <Text className={styles.emptyIcon}>💰</Text>
                    <Text className={styles.emptyText}>暂无费用记录</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
        
        {activeTab === 'reward' && (
          <View className={styles.section}>
            <View className={styles.rewardsCard}>
              <View className={styles.rewardsHeader}>
                <Text className={styles.rewardsTitle}>阶段奖励</Text>
                <Text className={styles.addReward} onClick={handleAddReward}>
                  + 添加奖励
                </Text>
              </View>
              
              {goal.rewards.map(reward => (
                <View key={reward.id} className={styles.rewardItem}>
                  <View className={classnames(styles.rewardIcon, reward.achieved && styles.achieved)}>
                    <Text>{reward.achieved ? '🎁' : '🏆'}</Text>
                  </View>
                  <View className={styles.rewardInfo} onClick={() => handleEditReward(reward)}>
                    <Text className={styles.rewardTitle}>{reward.title}</Text>
                    <Text className={styles.rewardCondition}>{reward.condition}</Text>
                    {reward.description && (
                      <Text className={styles.rewardDesc}>{reward.description}</Text>
                    )}
                  </View>
                  <View className={styles.rewardActions}>
                    <View 
                      className={classnames(
                        'tag', 
                        reward.achieved ? 'tagSuccess' : 'tagWarning',
                        styles.rewardStatus
                      )}
                      onClick={() => handleToggleReward(reward.id)}
                    >
                      {reward.achieved ? '已达成' : '待达成'}
                    </View>
                    <Text className={styles.rewardDelete} onClick={() => handleDeleteReward(reward.id)}>
                      删除
                    </Text>
                  </View>
                </View>
              ))}
              
              {goal.rewards.length === 0 && (
                <View className={styles.emptyExpenses}>
                  <Text className={styles.emptyIcon}>🎁</Text>
                  <Text className={styles.emptyText}>暂无奖励设置，点击上方添加</Text>
                </View>
              )}
            </View>
          </View>
        )}
        
        {activeTab === 'comment' && (
          <View className={styles.section}>
            <View className={styles.commentsCard}>
              <View className={styles.commentsHeader}>
                <Text className={styles.commentsTitle}>
                  评论交流 ({goal.comments.length})
                </Text>
              </View>
              
              <View className={styles.commentList}>
                {goal.comments.map(comment => (
                  <View key={comment.id} className={styles.commentItem}>
                    <Image
                      className={styles.avatar}
                      src={memberAvatarById(comment.authorId)}
                      mode='aspectFill'
                    />
                    <View className={styles.commentContent}>
                      <View className={styles.commentHeader}>
                        <Text className={styles.authorName}>
                          {memberNameById(comment.authorId)}
                        </Text>
                        <Text className={styles.commentTime}>{comment.createdAt}</Text>
                      </View>
                      <Text className={styles.commentText}>{comment.content}</Text>
                    </View>
                  </View>
                ))}
                
                {goal.comments.length === 0 && (
                  <View className={styles.emptyComments}>
                    <Text className={styles.emptyIcon}>💬</Text>
                    <Text className={styles.emptyText}>快来发表第一条评论吧</Text>
                  </View>
                )}
              </View>
              
              <View className={styles.commentInput}>
                <Input
                  className={styles.input}
                  placeholder='说点什么...'
                  value={commentText}
                  onInput={(e) => setCommentText(e.detail.value)}
                />
                <Button 
                  className={styles.sendButton}
                  onClick={handleSendComment}
                >
                  发送
                </Button>
              </View>
            </View>
          </View>
        )}
      </View>
      
      <View className={styles.bottomActions}>
        <Button className={classnames(styles.actionBtn, styles.secondary)} onClick={handleEditGoal}>
          编辑
        </Button>
        {goal.status !== 'completed' && (
          <Button className={classnames(styles.actionBtn, styles.primary)} onClick={handleCompleteGoal}>
            标记完成
          </Button>
        )}
      </View>
      
      {rewardModalVisible && (
        <View className={styles.modalOverlay} onClick={() => setRewardModalVisible(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>
                {editingReward ? '编辑奖励' : '添加奖励'}
              </Text>
              <Text className={styles.modalClose} onClick={() => setRewardModalVisible(false)}>✕</Text>
            </View>
            
            <View className={styles.modalBody}>
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>奖励名称</Text>
                <Input
                  className={styles.formInput}
                  placeholder='例如：吃一顿大餐'
                  value={rewardTitle}
                  onInput={(e) => setRewardTitle(e.detail.value)}
                  maxlength={30}
                />
              </View>
              
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>达成条件</Text>
                <Input
                  className={styles.formInput}
                  placeholder='例如：进度达到50%'
                  value={rewardCondition}
                  onInput={(e) => setRewardCondition(e.detail.value)}
                  maxlength={50}
                />
              </View>
              
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>详细描述（选填）</Text>
                <Input
                  className={styles.formInput}
                  placeholder='奖励的具体内容或说明...'
                  value={rewardDescription}
                  onInput={(e) => setRewardDescription(e.detail.value)}
                  maxlength={100}
                />
              </View>
            </View>
            
            <View className={styles.modalFooter}>
              <Button 
                className={classnames(styles.modalBtn, styles.modalBtnSecondary)} 
                onClick={() => setRewardModalVisible(false)}
              >
                取消
              </Button>
              <Button 
                className={classnames(styles.modalBtn, styles.modalBtnPrimary)} 
                onClick={handleSaveReward}
              >
                保存
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default GoalDetailPage;
