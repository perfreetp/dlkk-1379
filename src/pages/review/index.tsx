import React, { useState, useMemo } from 'react';
import { View, Text, Textarea, Image, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { useGoalStore } from '@/store/useGoalStore';
import { memberAvatarById } from '@/data/mockData';
import type { Contribution } from '@/types';

interface ContributionWithMember extends Contribution {
  name: string;
  avatar: string;
  rank: number;
}

const ReviewPage: React.FC = () => {
  const router = useRouter();
  const goalId = router.params.id as string;
  
  const { 
    goals, 
    getGoalById, 
    saveReview,
    getMemberById
  } = useGoalStore();
  
  const [summary, setSummary] = useState('');
  const [highlights, setHighlights] = useState<string[]>([]);
  const [newHighlight, setNewHighlight] = useState('');
  const [improvements, setImprovements] = useState<string[]>([]);
  const [newImprovement, setNewImprovement] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  
  const goal = useMemo(() => {
    return getGoalById(goalId);
  }, [goals, goalId]);
  
  React.useEffect(() => {
    if (goal?.review) {
      setSummary(goal.review.summary);
      setHighlights(goal.review.highlights);
      setImprovements(goal.review.improvements);
      setPhotos(goal.review.photos || []);
    }
  }, [goal?.review?.id]);
  
  const contributions = useMemo<ContributionWithMember[]>(() => {
    if (!goal) return [];
    
    const memberContributions: ContributionWithMember[] = goal.visibleMemberIds.map(memberId => {
      const member = getMemberById(memberId);
      const completedTasks = goal.tasks.filter(t => t.assigneeId === memberId && t.status === 'completed').length;
      const totalTasks = goal.tasks.filter(t => t.assigneeId === memberId).length;
      const expensesPaid = goal.expenses.filter(e => e.payerId === memberId).reduce((sum, e) => sum + e.amount, 0);
      const commentsCount = goal.comments.filter(c => c.authorId === memberId).length;
      const score = completedTasks * 10 + Math.floor(expensesPaid / 100) * 5 + commentsCount * 2;
      
      return {
        memberId,
        completedTasks,
        totalTasks,
        expensesPaid,
        commentsCount,
        score,
        name: member?.name || '',
        avatar: member?.avatar || '',
        rank: 0
      };
    });
    
    memberContributions.sort((a, b) => b.score - a.score);
    memberContributions.forEach((c, index) => {
      c.rank = index + 1;
    });
    
    return memberContributions;
  }, [goal, getMemberById]);
  
  const getRankClass = (rank: number) => {
    switch (rank) {
      case 1: return 'rankGold';
      case 2: return 'rankSilver';
      case 3: return 'rankBronze';
      default: return 'rankNormal';
    }
  };
  
  const handleAddHighlight = () => {
    if (!newHighlight.trim()) return;
    setHighlights([...highlights, newHighlight.trim()]);
    setNewHighlight('');
  };
  
  const handleRemoveHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };
  
  const handleAddImprovement = () => {
    if (!newImprovement.trim()) return;
    setImprovements([...improvements, newImprovement.trim()]);
    setNewImprovement('');
  };
  
  const handleRemoveImprovement = (index: number) => {
    setImprovements(improvements.filter((_, i) => i !== index));
  };
  
  const handleAddPhoto = () => {
    Taro.chooseImage({
      count: 9 - photos.length,
      success: (res) => {
        setPhotos([...photos, ...res.tempFilePaths]);
        console.log('[Review] Added photos:', res.tempFilePaths.length);
      }
    });
  };
  
  const validateForm = () => {
    if (!summary.trim()) {
      Taro.showToast({ title: '请填写复盘总结', icon: 'none' });
      return false;
    }
    return true;
  };
  
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    saveReview(goalId, {
      summary: summary.trim(),
      highlights,
      improvements,
      photos
    });
    
    Taro.showToast({
      title: '复盘完成',
      icon: 'success'
    });
    
    console.log('[Review] Completed review for goal:', goalId);
    
    setTimeout(() => {
      Taro.switchTab({ url: '/pages/goals/index' });
    }, 1500);
  };
  
  const handleCancel = () => {
    Taro.navigateBack();
  };
  
  if (!goal) {
    return (
      <View className={styles.reviewPage}>
        <View className='emptyState'>
          <Text className='emptyIcon'>❓</Text>
          <Text className='emptyText'>目标不存在</Text>
        </View>
      </View>
    );
  }
  
  if (goal.review) {
    return (
      <View className={styles.reviewPage}>
        <View className={styles.goalSummaryCard}>
          <Text className={styles.goalTitle}>{goal.title}</Text>
          <View className={styles.goalStats}>
            <View className={styles.statItem}>
              <Text className={classnames(styles.statValue, styles.statsHighlight)}>{goal.progress}%</Text>
              <Text className={styles.statLabel}>完成进度</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{goal.tasks.filter(t => t.status === 'completed').length}/{goal.tasks.length}</Text>
              <Text className={styles.statLabel}>任务完成</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>¥{goal.usedBudget.toLocaleString()}</Text>
              <Text className={styles.statLabel}>实际花费</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={classnames(styles.statValue, goal.usedBudget > goal.budget ? styles.statsWarning : styles.statsHighlight)}>
                {goal.usedBudget > goal.budget ? '超支' : '正常'}
              </Text>
              <Text className={styles.statLabel}>预算状态</Text>
            </View>
          </View>
        </View>
        
        <View className={styles.existingReviewCard}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📝</Text>
            复盘总结
          </Text>
          
          <Text className={styles.reviewSummary}>{goal.review.summary}</Text>
          
          <View className={styles.reviewSection}>
            <Text className={styles.reviewSectionLabel}>
              <Text>✨</Text> 亮点
            </Text>
            <View className={styles.reviewTags}>
              {goal.review.highlights.map((h, i) => (
                <View key={i} className={classnames('tag', 'tagSuccess')}>
                  {h}
                </View>
              ))}
            </View>
          </View>
          
          <View className={styles.reviewSection}>
            <Text className={styles.reviewSectionLabel}>
              <Text>💡</Text> 改进点
            </Text>
            <View className={styles.reviewTags}>
              {goal.review.improvements.map((im, i) => (
                <View key={i} className={classnames('tag', 'tagWarning')}>
                  {im}
                </View>
              ))}
            </View>
          </View>
          
          <Text className={styles.reviewDate}>
            复盘时间：{dayjs(goal.review.createdAt).format('YYYY-MM-DD HH:mm')}
          </Text>
          
          {goal.review.photos && goal.review.photos.length > 0 && (
            <View className={styles.reviewPhotosSection}>
              <Text className={styles.reviewSectionLabel}>
                <Text>📷</Text> 照片凭证
              </Text>
              <View className={styles.reviewPhotosGrid}>
                {goal.review.photos.map((photo, index) => (
                  <Image
                    key={index}
                    className={styles.reviewPhoto}
                    src={photo}
                    mode='aspectFill'
                    onClick={() => {
                      Taro.previewImage({
                        urls: goal.review?.photos || [],
                        current: photo
                      });
                    }}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
        
        <View className={styles.memberContributionCard}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>🏆</Text>
            成员贡献排行
          </Text>
          
          <View className={styles.contributionList}>
            {contributions.map(contribution => (
              <View key={contribution.memberId} className={styles.contributionItem}>
                <View className={classnames(styles.rankBadge, styles[getRankClass(contribution.rank)])}>
                  {contribution.rank}
                </View>
                <Image
                  className={styles.memberAvatar}
                  src={memberAvatarById(contribution.memberId)}
                  mode='aspectFill'
                />
                <View className={styles.memberInfo}>
                  <Text className={styles.memberName}>{contribution.name}</Text>
                  <Text className={styles.memberStats}>
                    完成{contribution.completedTasks}个任务 · 支付¥{contribution.expensesPaid.toLocaleString()} · {contribution.commentsCount}条评论
                  </Text>
                </View>
                <Text className={styles.memberScore}>{contribution.score}分</Text>
              </View>
            ))}
          </View>
        </View>
        
        {goal.rewards.length > 0 && (
          <View className={styles.rewardSection}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>🎁</Text>
              阶段奖励
            </Text>
            
            <View className={styles.rewardsList}>
              {goal.rewards.map(reward => (
                <View key={reward.id} className={styles.rewardItem}>
                  <Text className={styles.rewardIcon}>
                    {reward.achieved ? '🎁' : '🏆'}
                  </Text>
                  <View className={styles.rewardInfo}>
                    <Text className={styles.rewardTitle}>{reward.title}</Text>
                    <Text className={styles.rewardCondition}>{reward.condition}</Text>
                  </View>
                  <Text className={classnames(
                    styles.rewardStatus,
                    reward.achieved ? styles.rewardAchieved : styles.rewardPending
                  )}>
                    {reward.achieved ? '已达成' : '未达成'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  }
  
  return (
    <View className={styles.reviewPage}>
      <View className={styles.goalSummaryCard}>
        <Text className={styles.goalTitle}>{goal.title}</Text>
        <View className={styles.goalStats}>
          <View className={styles.statItem}>
            <Text className={classnames(styles.statValue, styles.statsHighlight)}>{goal.progress}%</Text>
            <Text className={styles.statLabel}>完成进度</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{goal.tasks.filter(t => t.status === 'completed').length}/{goal.tasks.length}</Text>
            <Text className={styles.statLabel}>任务完成</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>¥{goal.usedBudget.toLocaleString()}</Text>
            <Text className={styles.statLabel}>实际花费</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={classnames(styles.statValue, goal.usedBudget > goal.budget ? styles.statsWarning : styles.statsHighlight)}>
              {goal.usedBudget > goal.budget ? '超支' : '正常'}
            </Text>
            <Text className={styles.statLabel}>预算状态</Text>
          </View>
        </View>
      </View>
      
      <View className={styles.memberContributionCard}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>🏆</Text>
          成员贡献排行
        </Text>
        
        <View className={styles.contributionList}>
          {contributions.map(contribution => (
            <View key={contribution.memberId} className={styles.contributionItem}>
              <View className={classnames(styles.rankBadge, styles[getRankClass(contribution.rank)])}>
                {contribution.rank}
              </View>
              <Image
                className={styles.memberAvatar}
                src={memberAvatarById(contribution.memberId)}
                mode='aspectFill'
              />
              <View className={styles.memberInfo}>
                <Text className={styles.memberName}>{contribution.name}</Text>
                <Text className={styles.memberStats}>
                  完成{contribution.completedTasks}个任务 · 支付¥{contribution.expensesPaid.toLocaleString()} · {contribution.commentsCount}条评论
                </Text>
              </View>
              <Text className={styles.memberScore}>{contribution.score}分</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View className={styles.formCard}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📝</Text>
          复盘总结
        </Text>
        
        <View className={styles.formGroup}>
          <Text className={classnames(styles.formLabel, styles.formLabelRequired)}>总体评价</Text>
          <Textarea
            className={styles.textarea}
            placeholder='总结一下这次目标完成过程中的整体感受和收获...'
            value={summary}
            onInput={(e) => setSummary(e.detail.value)}
            maxlength={500}
          />
        </View>
        
        <View className={styles.tagsInputSection}>
          <Text className={styles.formLabel}>亮点</Text>
          <View className={styles.tagsContainer}>
            {highlights.map((h, i) => (
              <View key={i} className={classnames(styles.tagItem, styles.highlightTag)}>
                <Text>{h}</Text>
                <Text className={styles.tagRemove} onClick={() => handleRemoveHighlight(i)}>✕</Text>
              </View>
            ))}
          </View>
          <View className={styles.tagInputRow}>
            <Input
              className={styles.tagInput}
              placeholder='添加一个亮点...'
              value={newHighlight}
              onInput={(e) => setNewHighlight(e.detail.value)}
              maxlength={20}
            />
            <View className={styles.tagAddBtn} onClick={handleAddHighlight}>
              添加
            </View>
          </View>
        </View>
        
        <View className={styles.tagsInputSection}>
          <Text className={styles.formLabel}>改进点</Text>
          <View className={styles.tagsContainer}>
            {improvements.map((im, i) => (
              <View key={i} className={classnames(styles.tagItem, styles.improvementTag)}>
                <Text>{im}</Text>
                <Text className={styles.tagRemove} onClick={() => handleRemoveImprovement(i)}>✕</Text>
              </View>
            ))}
          </View>
          <View className={styles.tagInputRow}>
            <Input
              className={styles.tagInput}
              placeholder='添加一个改进点...'
              value={newImprovement}
              onInput={(e) => setNewImprovement(e.detail.value)}
              maxlength={20}
            />
            <View className={styles.tagAddBtn} onClick={handleAddImprovement}>
              添加
            </View>
          </View>
        </View>
      </View>
      
      <View className={styles.photosSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📷</Text>
          照片凭证
        </Text>
        
        <View className={styles.photosGrid}>
          {photos.map((photo, index) => (
            <View key={index} className={styles.photoItem}>
              <Image className={styles.photoImg} src={photo} mode='aspectFill' />
            </View>
          ))}
          {photos.length < 9 && (
            <View className={styles.addPhotoBtn} onClick={handleAddPhoto}>
              <Text className={styles.addPhotoIcon}>+</Text>
              <Text className={styles.addPhotoText}>添加照片</Text>
            </View>
          )}
        </View>
      </View>
      
      {goal.rewards.length > 0 && (
        <View className={styles.rewardSection}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>🎁</Text>
            阶段奖励
          </Text>
          
          <View className={styles.rewardsList}>
            {goal.rewards.map(reward => (
              <View key={reward.id} className={styles.rewardItem}>
                <Text className={styles.rewardIcon}>
                  {reward.achieved ? '🎁' : '🏆'}
                </Text>
                <View className={styles.rewardInfo}>
                  <Text className={styles.rewardTitle}>{reward.title}</Text>
                  <Text className={styles.rewardCondition}>{reward.condition}</Text>
                </View>
                <Text className={classnames(
                  styles.rewardStatus,
                  reward.achieved ? styles.rewardAchieved : styles.rewardPending
                )}>
                  {reward.achieved ? '已达成' : '未达成'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      <View className={styles.bottomActions}>
        <Button
          className={classnames(styles.actionBtn, styles.secondary)}
          onClick={handleCancel}
        >
          取消
        </Button>
        <Button
          className={classnames(styles.actionBtn, styles.primary)}
          onClick={handleSubmit}
        >
          完成复盘
        </Button>
      </View>
    </View>
  );
};

export default ReviewPage;
