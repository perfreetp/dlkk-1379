import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Input, Textarea, Image, Button, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useGoalStore } from '@/store/useGoalStore';
import { memberAvatarById, memberNameById, statusLabels, priorityLabels } from '@/data/mockData';
import type { Task } from '@/types';

const priorities = [
  { key: 'low' as const, label: '低优先级', icon: '🟢', activeClass: 'priorityItemActiveLow', labelClass: 'priorityLabelActiveLow' },
  { key: 'medium' as const, label: '中优先级', icon: '🟡', activeClass: 'priorityItemActiveMedium', labelClass: 'priorityLabelActiveMedium' },
  { key: 'high' as const, label: '高优先级', icon: '🔴', activeClass: 'priorityItemActiveHigh', labelClass: 'priorityLabelActiveHigh' }
];

const reminderOptions = [
  { key: 'none', label: '不提醒' },
  { key: 'ondeday', label: '截止前1天提醒' },
  { key: 'threedays', label: '截止前3天提醒' },
  { key: 'oneweek', label: '截止前1周提醒' }
];

const TaskAssignPage: React.FC = () => {
  const router = useRouter();
  const goalId = router.params.goalId as string;
  
  const { 
    goals, 
    members, 
    currentUserId, 
    getGoalById, 
    addTask, 
    checkDateConflict,
    getMemberById
  } = useGoalStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [assigneeId, setAssigneeId] = useState(currentUserId);
  const [deadline, setDeadline] = useState('');
  const [reminder, setReminder] = useState('ondeday');
  const [hasConflict, setHasConflict] = useState(false);
  
  const goal = useMemo(() => {
    return getGoalById(goalId);
  }, [goals, goalId]);
  
  useEffect(() => {
    if (deadline) {
      const conflict = checkDateConflict(deadline);
      setHasConflict(conflict);
    }
  }, [deadline, checkDateConflict]);
  
  const validateForm = () => {
    if (!title.trim()) {
      Taro.showToast({ title: '请输入任务名称', icon: 'none' });
      return false;
    }
    if (!assigneeId) {
      Taro.showToast({ title: '请选择负责人', icon: 'none' });
      return false;
    }
    return true;
  };
  
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    addTask(goalId, {
      title: title.trim(),
      description: description.trim(),
      assigneeId,
      status: 'pending',
      priority,
      deadline: deadline || undefined
    });
    
    Taro.showToast({
      title: '任务添加成功',
      icon: 'success'
    });
    
    console.log('[TaskAssign] Added task:', title, 'to goal:', goalId);
    
    if (reminder !== 'none' && assigneeId) {
      const assignee = getMemberById(assigneeId);
      setTimeout(() => {
        Taro.showToast({
          title: `已设置提醒${assignee?.name}`,
          icon: 'none'
        });
      }, 1500);
    }
    
    setTimeout(() => {
      Taro.navigateBack();
    }, 1500);
  };
  
  const handleCancel = () => {
    Taro.navigateBack();
  };
  
  const handleRemindMember = (memberId: string) => {
    const member = getMemberById(memberId);
    Taro.showModal({
      title: '确认催办',
      content: `确定要向${member?.name}发送催办提醒吗？`,
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({
            title: `已催办${member?.name}`,
            icon: 'success'
          });
          console.log('[TaskAssign] Reminded member:', memberId);
        }
      }
    });
  };
  
  const getStatusDotClass = (status: Task['status']) => {
    switch (status) {
      case 'completed': return 'statusCompleted';
      case 'in_progress': return 'statusInProgress';
      default: return 'statusPending';
    }
  };
  
  if (!goal) {
    return (
      <View className={styles.taskAssignPage}>
        <View className='emptyState'>
          <Text className='emptyIcon'>❓</Text>
          <Text className='emptyText'>目标不存在</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View className={styles.taskAssignPage}>
      <View className={styles.goalHeader}>
        <Text className={styles.goalTitle}>{goal.title}</Text>
        <View className={styles.goalMeta}>
          <View className={styles.goalMetaItem}>
            <Text className={styles.goalMetaIcon}>📅</Text>
            <Text>{goal.startDate} ~ {goal.deadline}</Text>
          </View>
          <View className={styles.goalMetaItem}>
            <Text className={styles.goalMetaIcon}>💰</Text>
            <Text>¥{goal.budget.toLocaleString()}</Text>
          </View>
          <View className={styles.goalMetaItem}>
            <Text className={styles.goalMetaIcon}>📊</Text>
            <Text>进度 {goal.progress}%</Text>
          </View>
        </View>
      </View>
      
      <View className={styles.formCard}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📝</Text>
          新任务信息
        </Text>
        
        <View className={styles.formGroup}>
          <Text className={classnames(styles.formLabel, styles.formLabelRequired)}>任务名称</Text>
          <Input
            className={styles.input}
            placeholder='例如：预订机票'
            value={title}
            onInput={(e) => setTitle(e.detail.value)}
            maxlength={50}
          />
        </View>
        
        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>任务描述</Text>
          <Textarea
            className={styles.textarea}
            placeholder='详细描述任务内容和要求...'
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
            maxlength={200}
          />
        </View>
        
        <View className={styles.prioritySection}>
          <Text className={styles.formLabel}>优先级</Text>
          <View className={styles.priorityGrid}>
            {priorities.map(p => (
              <View
                key={p.key}
                className={classnames(
                  styles.priorityItem,
                  priority === p.key && styles[p.activeClass]
                )}
                onClick={() => setPriority(p.key)}
              >
                <Text className={styles.priorityIcon}>{p.icon}</Text>
                <Text className={classnames(
                  styles.priorityLabel,
                  priority === p.key && styles[p.labelClass]
                )}>
                  {p.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
        
        <View className={styles.assigneeSection}>
          <Text className={classnames(styles.formLabel, styles.formLabelRequired)}>负责人</Text>
          <View className={styles.assigneesList}>
            {members.map(member => (
              <View
                key={member.id}
                className={styles.assigneeItem}
                onClick={() => setAssigneeId(member.id)}
              >
                <View className={styles.avatarWrapper}>
                  <Image
                    className={classnames(
                      styles.assigneeAvatar,
                      assigneeId === member.id && styles.assigneeAvatarSelected
                    )}
                    src={memberAvatarById(member.id)}
                    mode='aspectFill'
                  />
                  {assigneeId === member.id && (
                    <Text className={styles.checkIcon}>✓</Text>
                  )}
                </View>
                <Text className={classnames(
                  styles.assigneeName,
                  assigneeId === member.id && styles.assigneeNameSelected
                )}>
                  {member.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
        
        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>截止日期</Text>
          <Picker
            mode='date'
            value={deadline}
            onChange={(e) => setDeadline(e.detail.value)}
          >
            <View className={styles.dateInput}>
              {deadline ? (
                <Text>{deadline}</Text>
              ) : (
                <Text className={styles.datePlaceholder}>请选择截止日期（可选）</Text>
              )}
            </View>
          </Picker>
          
          {hasConflict && (
            <View className={styles.conflictWarning}>
              <Text className={styles.conflictIcon}>⚠️</Text>
              <Text className={styles.conflictText}>该日期与现有日程冲突，请考虑调整</Text>
            </View>
          )}
        </View>
        
        <View className={styles.reminderSection}>
          <Text className={styles.formLabel}>提醒设置</Text>
          <View className={styles.reminderOptions}>
            {reminderOptions.map(opt => (
              <View
                key={opt.key}
                className={classnames(
                  styles.reminderOption,
                  reminder === opt.key && styles.reminderOptionActive
                )}
                onClick={() => setReminder(opt.key)}
              >
                <Text className={styles.reminderLabel}>{opt.label}</Text>
                <View className={classnames(
                  styles.reminderRadio,
                  reminder === opt.key && styles.reminderRadioActive
                )}>
                  {reminder === opt.key && (
                    <Text className={styles.reminderRadioCheck}>✓</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
      
      {goal.tasks.length > 0 && (
        <View className={styles.existingTasksCard}>
          <View className={styles.existingTasksHeader}>
            <Text className={styles.existingTasksTitle}>现有任务</Text>
            <Text className={styles.existingTaskCount}>
              {goal.tasks.filter(t => t.status === 'completed').length}/{goal.tasks.length} 已完成
            </Text>
          </View>
          
          {goal.tasks.map(task => (
            <View key={task.id} className={styles.existingTaskItem}>
              <View className={classnames(styles.taskStatusDot, styles[getStatusDotClass(task.status)])} />
              <View className={styles.taskInfo}>
                <Text className={styles.taskTitle}>{task.title}</Text>
                <View className={styles.taskMeta}>
                  <View className={styles.taskMetaItem}>
                    <Text>{priorityLabels[task.priority]}</Text>
                  </View>
                  <View className={styles.taskMetaItem}>
                    <Image
                      className={styles.taskAssigneeAvatar}
                      src={memberAvatarById(task.assigneeId)}
                      mode='aspectFill'
                    />
                    <Text>{memberNameById(task.assigneeId)}</Text>
                  </View>
                  {task.deadline && (
                    <View className={styles.taskMetaItem}>
                      <Text>📅 {task.deadline}</Text>
                    </View>
                  )}
                  <View className={styles.taskMetaItem}>
                    <Text>{statusLabels[task.status]}</Text>
                  </View>
                  {task.status !== 'completed' && (
                    <View 
                      className={styles.taskMetaItem}
                      onClick={() => handleRemindMember(task.assigneeId)}
                    >
                      <Text style={{ color: '#FF7A59' }}>🔔 催办</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))}
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
          添加任务
        </Button>
      </View>
    </View>
  );
};

export default TaskAssignPage;
