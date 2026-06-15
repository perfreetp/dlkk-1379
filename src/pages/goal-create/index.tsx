import React, { useState, useEffect } from 'react';
import { View, Text, Input, Textarea, Image, Button, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { useGoalStore } from '@/store/useGoalStore';
import { memberAvatarById } from '@/data/mockData';
import type { Goal, Task } from '@/types';

interface TaskForm {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  assigneeId: string;
  deadline: string;
  remind: boolean;
}

const categories: Array<{ key: Goal['category']; label: string; icon: string }> = [
  { key: 'travel', label: '旅行', icon: '✈️' },
  { key: 'saving', label: '储蓄', icon: '💰' },
  { key: 'organizing', label: '整理', icon: '🏠' },
  { key: 'health', label: '健康', icon: '💪' },
  { key: 'study', label: '学习', icon: '📚' },
  { key: 'other', label: '其他', icon: '📌' }
];

const priorities: Array<{ key: Task['priority']; label: string; class: string }> = [
  { key: 'low', label: '低', class: 'priorityLowActive' },
  { key: 'medium', label: '中', class: 'priorityMediumActive' },
  { key: 'high', label: '高', class: 'priorityHighActive' }
];

const GoalCreatePage: React.FC = () => {
  const router = useRouter();
  const editId = router.params.id as string | undefined;
  
  const { members, currentUserId, addGoal, updateGoal, getGoalById, checkDateConflict } = useGoalStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Goal['category']>('travel');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [deadline, setDeadline] = useState(dayjs().add(30, 'day').format('YYYY-MM-DD'));
  const [completionCriteria, setCompletionCriteria] = useState('');
  const [visibleMemberIds, setVisibleMemberIds] = useState<string[]>([currentUserId]);
  const [tasks, setTasks] = useState<TaskForm[]>([]);
  const [goalConflict, setGoalConflict] = useState(false);
  const [startDateConflict, setStartDateConflict] = useState(false);
  const [taskConflicts, setTaskConflicts] = useState<Record<string, boolean>>({});
  
  const isEdit = !!editId;
  
  useEffect(() => {
    if (isEdit) {
      const goal = getGoalById(editId);
      if (goal) {
        setTitle(goal.title);
        setDescription(goal.description);
        setCategory(goal.category);
        setBudget(goal.budget.toString());
        setStartDate(goal.startDate);
        setDeadline(goal.deadline);
        setCompletionCriteria(goal.completionCriteria);
        setVisibleMemberIds(goal.visibleMemberIds);
        setTasks(goal.tasks.map(t => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          assigneeId: t.assigneeId,
          deadline: t.deadline || '',
          remind: true
        })));
      }
    }
  }, [isEdit, editId, getGoalById]);
  
  useEffect(() => {
    setGoalConflict(checkDateConflict(deadline));
  }, [deadline, checkDateConflict]);
  
  useEffect(() => {
    setStartDateConflict(checkDateConflict(startDate));
  }, [startDate, checkDateConflict]);
  
  useEffect(() => {
    const conflicts: Record<string, boolean> = {};
    tasks.forEach(t => {
      if (t.deadline) {
        conflicts[t.id] = checkDateConflict(t.deadline);
      }
    });
    setTaskConflicts(conflicts);
  }, [tasks, checkDateConflict]);
  
  const handleToggleMember = (memberId: string) => {
    setVisibleMemberIds(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };
  
  const handleAddTask = () => {
    const newTask: TaskForm = {
      id: Date.now().toString(),
      title: '',
      priority: 'medium',
      assigneeId: currentUserId,
      deadline: '',
      remind: true
    };
    setTasks([...tasks, newTask]);
  };
  
  const handleUpdateTask = (taskId: string, field: keyof TaskForm, value: any) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, [field]: value } : t
    ));
  };
  
  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };
  
  const validateForm = () => {
    if (!title.trim()) {
      Taro.showToast({ title: '请输入目标名称', icon: 'none' });
      return false;
    }
    if (!budget || Number(budget) < 0) {
      Taro.showToast({ title: '请输入有效预算', icon: 'none' });
      return false;
    }
    if (!startDate || !deadline) {
      Taro.showToast({ title: '请选择日期范围', icon: 'none' });
      return false;
    }
    if (dayjs(deadline).isBefore(dayjs(startDate))) {
      Taro.showToast({ title: '截止日期不能早于开始日期', icon: 'none' });
      return false;
    }
    if (!completionCriteria.trim()) {
      Taro.showToast({ title: '请输入完成标准', icon: 'none' });
      return false;
    }
    if (visibleMemberIds.length === 0) {
      Taro.showToast({ title: '请至少选择一名成员', icon: 'none' });
      return false;
    }
    return true;
  };
  
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    const validTasks = tasks.filter(t => t.title.trim());
    
    if (isEdit) {
      updateGoal(editId, {
        title: title.trim(),
        description: description.trim(),
        category,
        budget: Number(budget),
        startDate,
        deadline,
        completionCriteria: completionCriteria.trim(),
        visibleMemberIds,
        tasks: validTasks.map<Task>((t) => ({
          id: t.id,
          title: t.title.trim(),
          description: '',
          assigneeId: t.assigneeId,
          status: 'pending',
          priority: t.priority,
          deadline: t.deadline || undefined,
          createdAt: dayjs().toISOString()
        }))
      });
      
      Taro.showToast({ title: '更新成功', icon: 'success' });
    } else {
      addGoal({
        title: title.trim(),
        description: description.trim(),
        category,
        budget: Number(budget),
        usedBudget: 0,
        startDate,
        deadline,
        completionCriteria: completionCriteria.trim(),
        visibleMemberIds,
        createdBy: currentUserId,
        status: 'planning',
        progress: 0,
        tasks: validTasks.map<Task>((t) => ({
          id: t.id,
          title: t.title.trim(),
          description: '',
          assigneeId: t.assigneeId,
          status: 'pending',
          priority: t.priority,
          deadline: t.deadline || undefined,
          createdAt: dayjs().toISOString()
        })),
        expenses: [],
        comments: [],
        rewards: []
      });
      
      Taro.showToast({ title: '创建成功', icon: 'success' });
    }
    
    setTimeout(() => { Taro.navigateBack(); }, 1500);
  };
  
  const handleCancel = () => {
    Taro.navigateBack();
  };
  
  return (
    <View className={styles.createGoalPage}>
      <View className={styles.formCard}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📝</Text>
          基本信息
        </Text>
        
        <View className={styles.formGroup}>
          <Text className={classnames(styles.formLabel, styles.formLabelRequired)}>目标名称</Text>
          <Input
            className={styles.input}
            placeholder='例如：日本东京7日游'
            value={title}
            onInput={(e) => setTitle(e.detail.value)}
            maxlength={50}
          />
        </View>
        
        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>目标描述</Text>
          <Textarea
            className={styles.textarea}
            placeholder='简单描述一下这个目标...'
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
            maxlength={200}
          />
        </View>
        
        <View className={styles.formGroup}>
          <Text className={classnames(styles.formLabel, styles.formLabelRequired)}>分类</Text>
          <View className={styles.categoryGrid}>
            {categories.map(cat => (
              <View
                key={cat.key}
                className={classnames(styles.categoryItem, category === cat.key && styles.categoryItemActive)}
                onClick={() => setCategory(cat.key)}
              >
                <Text className={styles.categoryIcon}>{cat.icon}</Text>
                <Text className={classnames(styles.categoryName, category === cat.key && styles.categoryNameActive)}>
                  {cat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      
      <View className={styles.formCard}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📅</Text>
          时间与预算
        </Text>
        
        <View className={styles.formGroup}>
          <View className={styles.dateRow}>
            <View className={styles.dateItem}>
              <Text className={classnames(styles.formLabel, styles.formLabelRequired)}>开始日期</Text>
              <Picker mode='date' value={startDate} onChange={(e) => setStartDate(e.detail.value)}>
                <View className={styles.dateInput}>
                  <Text>{startDate}</Text>
                </View>
              </Picker>
              {startDateConflict && (
                <Text className={styles.dateConflictHint}>⚠️ 当天已有安排</Text>
              )}
            </View>
            <View className={styles.dateItem}>
              <Text className={classnames(styles.formLabel, styles.formLabelRequired)}>截止日期</Text>
              <Picker mode='date' value={deadline} onChange={(e) => setDeadline(e.detail.value)}>
                <View className={styles.dateInput}>
                  <Text>{deadline}</Text>
                </View>
              </Picker>
              {goalConflict && (
                <Text className={styles.dateConflictHint}>⚠️ 当天已有安排</Text>
              )}
            </View>
          </View>
        </View>
        
        <View className={styles.formGroup}>
          <Text className={classnames(styles.formLabel, styles.formLabelRequired)}>总预算</Text>
          <View className={styles.budgetInput}>
            <Text className={styles.currencyPrefix}>¥</Text>
            <Input
              className={classnames(styles.input, styles.budgetInputInner)}
              placeholder='请输入预算金额'
              type='digit'
              value={budget}
              onInput={(e) => setBudget(e.detail.value)}
            />
          </View>
        </View>
        
        <View className={styles.formGroup}>
          <Text className={classnames(styles.formLabel, styles.formLabelRequired)}>完成标准</Text>
          <Textarea
            className={styles.textarea}
            placeholder='描述达到什么标准才算完成目标...'
            value={completionCriteria}
            onInput={(e) => setCompletionCriteria(e.detail.value)}
            maxlength={200}
          />
        </View>
      </View>
      
      <View className={styles.formCard}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>👨‍👩‍👧‍👦</Text>
          参与成员
        </Text>
        
        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>选择可见成员</Text>
          <View className={styles.membersList}>
            {members.map(member => (
              <View
                key={member.id}
                className={styles.memberItem}
                onClick={() => handleToggleMember(member.id)}
              >
                <View className={styles.avatarWrapper}>
                  <Image
                    className={classnames(styles.memberAvatar, visibleMemberIds.includes(member.id) && styles.memberAvatarSelected)}
                    src={memberAvatarById(member.id)}
                    mode='aspectFill'
                  />
                  {visibleMemberIds.includes(member.id) && <Text className={styles.checkIcon}>✓</Text>}
                </View>
                <Text className={classnames(styles.memberName, visibleMemberIds.includes(member.id) && styles.memberNameSelected)}>
                  {member.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      
      <View className={styles.formCard}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>✅</Text>
          任务拆分
        </Text>
        
        <View className={styles.tasksSection}>
          <View className={styles.tasksHeader}>
            <Text className={styles.formLabel}>待办清单</Text>
            <Text className={styles.addTaskBtn} onClick={handleAddTask}>+ 添加任务</Text>
          </View>
          
          {tasks.length === 0 ? (
            <View className={styles.emptyTasks}>
              <Text>点击上方添加按钮，将目标拆分为具体任务</Text>
            </View>
          ) : (
            tasks.map((task, index) => (
              <View key={task.id} className={styles.taskItem}>
                <Text className={styles.taskIndex}>{index + 1}</Text>
                <View className={styles.taskContent}>
                  <Input
                    className={styles.taskTitleInput}
                    placeholder='输入任务名称'
                    value={task.title}
                    onInput={(e) => handleUpdateTask(task.id, 'title', e.detail.value)}
                    maxlength={50}
                  />
                  <View className={styles.taskMeta}>
                    <View className={styles.prioritySelector}>
                      {priorities.map(p => (
                        <Text
                          key={p.key}
                          className={classnames(styles.priorityTag, task.priority === p.key && styles[p.class])}
                          onClick={() => handleUpdateTask(task.id, 'priority', p.key)}
                        >{p.label}</Text>
                      ))}
                    </View>
                    <View className={styles.assigneeSelector}>
                      {members.map(m => (
                        <Image
                          key={m.id}
                          className={classnames(styles.assigneeAvatar, task.assigneeId === m.id && styles.assigneeAvatarSelected)}
                          src={memberAvatarById(m.id)}
                          mode='aspectFill'
                          onClick={() => handleUpdateTask(task.id, 'assigneeId', m.id)}
                        />
                      ))}
                    </View>
                  </View>
                  <View className={styles.taskDateRow}>
                    <View className={styles.taskDateItem}>
                      <Picker mode='date' value={task.deadline || deadline} onChange={(e) => handleUpdateTask(task.id, 'deadline', e.detail.value)}>
                        <View className={styles.taskDateInput}>
                          <Text className={styles.taskDateIcon}>📅</Text>
                          <Text className={classnames(styles.taskDateText, !task.deadline && styles.taskDatePlaceholder)}>
                            {task.deadline || '选截止日期'}
                          </Text>
                        </View>
                      </Picker>
                      {taskConflicts[task.id] && (
                        <Text className={styles.dateConflictHint}>⚠️ 冲突</Text>
                      )}
                    </View>
                    <View
                      className={classnames(styles.remindToggle, task.remind && styles.remindActive)}
                      onClick={() => handleUpdateTask(task.id, 'remind', !task.remind)}
                    >
                      <Text className={styles.remindIcon}>🔔</Text>
                      <Text className={styles.remindText}>{task.remind ? '已开提醒' : '开提醒'}</Text>
                    </View>
                  </View>
                </View>
                <Text className={styles.deleteTaskBtn} onClick={() => handleDeleteTask(task.id)}>✕</Text>
              </View>
            ))
          )}
        </View>
      </View>
      
      <View className={styles.bottomActions}>
        <Button className={classnames(styles.actionBtn, styles.secondary)} onClick={handleCancel}>取消</Button>
        <Button className={classnames(styles.actionBtn, styles.primary)} onClick={handleSubmit}>
          {isEdit ? '保存修改' : '创建目标'}
        </Button>
      </View>
    </View>
  );
};

export default GoalCreatePage;
