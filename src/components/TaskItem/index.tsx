import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import type { ITouchEvent } from '@tarojs/components/types/common';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import type { Task } from '@/types';
import { priorityLabels, memberNameById, memberAvatarById } from '@/data/mockData';

interface TaskItemProps {
  task: Task;
  goalId: string;
  onToggle?: () => void;
  onClick?: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, goalId, onToggle, onClick }) => {
  const isCompleted = task.status === 'completed';
  const isUrgent = task.deadline && dayjs(task.deadline).diff(dayjs(), 'day') <= 3 && !isCompleted;
  
  const getPriorityTagClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'tagError';
      case 'medium':
        return 'tagWarning';
      default:
        return 'tagSuccess';
    }
  };
  
  const handleToggle = (e: ITouchEvent) => {
    e.stopPropagation();
    if (onToggle) {
      onToggle();
    }
  };
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };
  
  return (
    <View 
      className={classnames(
        styles.taskItem,
        isCompleted && styles.completed,
        styles[`${task.priority}Priority`]
      )}
      onClick={handleClick}
    >
      <View 
        className={classnames(styles.checkbox, isCompleted && styles.checked)}
        onClick={handleToggle}
      >
        <Text className={styles.checkIcon}>✓</Text>
      </View>
      
      <View className={styles.taskContent}>
        <View className={styles.taskHeader}>
          <Text className={styles.taskTitle}>{task.title}</Text>
          <View className={classnames('tag', getPriorityTagClass(task.priority), styles.priorityTag)}>
            {priorityLabels[task.priority]}
          </View>
        </View>
        
        {task.description && (
          <Text className={styles.taskDescription}>{task.description}</Text>
        )}
        
        <View className={styles.taskMeta}>
          <View className={styles.assignee}>
            <Image 
              className={styles.avatar} 
              src={memberAvatarById(task.assigneeId)} 
              mode='aspectFill'
            />
            <Text className={styles.assigneeName}>{memberNameById(task.assigneeId)}</Text>
          </View>
          
          {task.deadline && (
            <Text className={classnames(styles.deadline, isUrgent && styles.urgent)}>
              {isUrgent ? '紧急 ' : ''}{task.deadline}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default TaskItem;
