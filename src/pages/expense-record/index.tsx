import React, { useState, useMemo } from 'react';
import { View, Text, Input, Textarea, Image, Button, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { useGoalStore } from '@/store/useGoalStore';
import { memberAvatarById, memberNameById } from '@/data/mockData';
import type { ExpenseRecord } from '@/types';

const expenseCategories = [
  { key: 'transport', label: '交通', icon: '✈️' },
  { key: 'hotel', label: '住宿', icon: '🏨' },
  { key: 'food', label: '餐饮', icon: '🍜' },
  { key: 'shopping', label: '购物', icon: '🛍️' },
  { key: 'ticket', label: '门票', icon: '🎫' },
  { key: 'utility', label: '水电', icon: '💡' },
  { key: 'medical', label: '医疗', icon: '💊' },
  { key: 'other', label: '其他', icon: '💰' }
];

const ExpenseRecordPage: React.FC = () => {
  const router = useRouter();
  const goalId = router.params.goalId as string;
  
  const { 
    goals, 
    members, 
    currentUserId, 
    getGoalById, 
    addExpense
  } = useGoalStore();
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState(currentUserId);
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [category, setCategory] = useState('other');
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  
  const goal = useMemo(() => {
    return getGoalById(goalId);
  }, [goals, goalId]);
  
  const remainingBudget = useMemo(() => {
    if (!goal) return 0;
    return goal.budget - goal.usedBudget;
  }, [goal]);
  
  const handleAddPhoto = () => {
    Taro.chooseImage({
      count: 9 - photos.length,
      success: (res) => {
        setPhotos([...photos, ...res.tempFilePaths]);
        console.log('[ExpenseRecord] Added photos:', res.tempFilePaths.length);
      }
    });
  };
  
  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };
  
  const validateForm = () => {
    if (!title.trim()) {
      Taro.showToast({ title: '请输入费用名称', icon: 'none' });
      return false;
    }
    if (!amount || Number(amount) <= 0) {
      Taro.showToast({ title: '请输入有效金额', icon: 'none' });
      return false;
    }
    if (!payerId) {
      Taro.showToast({ title: '请选择支付人', icon: 'none' });
      return false;
    }
    return true;
  };
  
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    const expenseData: Omit<ExpenseRecord, 'id' | 'createdAt'> = {
      title: title.trim(),
      amount: Number(amount),
      payerId,
      date,
      note: note.trim() || undefined,
      photoUrl: photos[0] || undefined
    };
    
    addExpense(goalId, expenseData);
    
    const newUsedBudget = goal ? goal.usedBudget + Number(amount) : Number(amount);
    const newRemaining = goal ? goal.budget - newUsedBudget : -Number(amount);
    
    if (newRemaining < 0) {
      Taro.showModal({
        title: '预算提醒',
        content: `本次记账后已超支 ¥${Math.abs(newRemaining).toLocaleString()}，请注意控制开支。`,
        showCancel: false
      });
    } else {
      Taro.showToast({
        title: '记账成功',
        icon: 'success'
      });
    }
    
    console.log('[ExpenseRecord] Added expense:', title, 'amount:', amount);
    
    setTimeout(() => {
      Taro.navigateBack();
    }, 1500);
  };
  
  const handleCancel = () => {
    Taro.navigateBack();
  };
  
  const getCategoryIcon = (key: string) => {
    const cat = expenseCategories.find(c => c.key === key);
    return cat?.icon || '💰';
  };
  
  if (!goal) {
    return (
      <View className={styles.expenseRecordPage}>
        <View className='emptyState'>
          <Text className='emptyIcon'>❓</Text>
          <Text className='emptyText'>目标不存在</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View className={styles.expenseRecordPage}>
      <View className={styles.goalHeader}>
        <Text className={styles.goalTitle}>{goal.title}</Text>
        <View className={styles.budgetInfo}>
          <View className={styles.budgetItem}>
            <Text className={classnames(styles.budgetValue, styles.spentValue)}>
              ¥{goal.usedBudget.toLocaleString()}
            </Text>
            <Text className={styles.budgetLabel}>已花费</Text>
          </View>
          <View className={styles.budgetItem}>
            <Text className={styles.budgetValue}>
              ¥{goal.budget.toLocaleString()}
            </Text>
            <Text className={styles.budgetLabel}>总预算</Text>
          </View>
          <View className={styles.budgetItem}>
            <Text className={classnames(
              styles.budgetValue,
              remainingBudget < 0 ? styles.overBudget : styles.remainingValue
            )}>
              {remainingBudget < 0 ? '-' : ''}¥{Math.abs(remainingBudget).toLocaleString()}
            </Text>
            <Text className={styles.budgetLabel}>
              {remainingBudget < 0 ? '超支' : '剩余'}
            </Text>
          </View>
        </View>
      </View>
      
      <View className={styles.formCard}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>💳</Text>
          费用信息
        </Text>
        
        <View className={styles.formGroup}>
          <Text className={classnames(styles.formLabel, styles.formLabelRequired)}>费用名称</Text>
          <Input
            className={styles.input}
            placeholder='例如：机票款、酒店费'
            value={title}
            onInput={(e) => setTitle(e.detail.value)}
            maxlength={30}
          />
        </View>
        
        <View className={styles.formGroup}>
          <Text className={classnames(styles.formLabel, styles.formLabelRequired)}>金额</Text>
          <View className={styles.amountInputWrapper}>
            <Text className={styles.currencyPrefix}>¥</Text>
            <Input
              className={classnames(styles.input, styles.amountInput)}
              placeholder='0.00'
              type='digit'
              value={amount}
              onInput={(e) => setAmount(e.detail.value)}
            />
          </View>
        </View>
        
        <View className={styles.categorySection}>
          <Text className={styles.formLabel}>消费类别</Text>
          <View className={styles.categoryGrid}>
            {expenseCategories.map(cat => (
              <View
                key={cat.key}
                className={classnames(
                  styles.categoryItem,
                  category === cat.key && styles.categoryItemActive
                )}
                onClick={() => setCategory(cat.key)}
              >
                <Text className={styles.categoryIcon}>{cat.icon}</Text>
                <Text className={classnames(
                  styles.categoryLabel,
                  category === cat.key && styles.categoryLabelActive
                )}>
                  {cat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
        
        <View className={styles.payerSection}>
          <Text className={classnames(styles.formLabel, styles.formLabelRequired)}>支付人</Text>
          <View className={styles.payersList}>
            {members.map(member => (
              <View
                key={member.id}
                className={styles.payerItem}
                onClick={() => setPayerId(member.id)}
              >
                <View className={styles.avatarWrapper}>
                  <Image
                    className={classnames(
                      styles.payerAvatar,
                      payerId === member.id && styles.payerAvatarSelected
                    )}
                    src={memberAvatarById(member.id)}
                    mode='aspectFill'
                  />
                  {payerId === member.id && (
                    <Text className={styles.checkIcon}>✓</Text>
                  )}
                </View>
                <Text className={classnames(
                  styles.payerName,
                  payerId === member.id && styles.payerNameSelected
                )}>
                  {member.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
        
        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>日期</Text>
          <Picker
            mode='date'
            value={date}
            onChange={(e) => setDate(e.detail.value)}
          >
            <View className={styles.dateInput}>
              <Text>{date}</Text>
            </View>
          </Picker>
        </View>
        
        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>备注</Text>
          <Textarea
            className={styles.textarea}
            placeholder='添加备注信息...'
            value={note}
            onInput={(e) => setNote(e.detail.value)}
            maxlength={200}
          />
        </View>
        
        <View className={styles.photoSection}>
          <Text className={styles.formLabel}>照片凭证（可选）</Text>
          <View className={styles.photosGrid}>
            {photos.map((photo, index) => (
              <View key={index} className={styles.photoItem}>
                <Image className={styles.photoImg} src={photo} mode='aspectFill' />
                <View 
                  className={styles.photoDelete}
                  onClick={() => handleRemovePhoto(index)}
                >
                  ✕
                </View>
              </View>
            ))}
            {photos.length < 9 && (
              <View className={styles.addPhotoBtn} onClick={handleAddPhoto}>
                <Text className={styles.addPhotoIcon}>+</Text>
                <Text className={styles.addPhotoText}>添加</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      
      {goal.expenses.length > 0 && (
        <View className={styles.existingExpensesCard}>
          <View className={styles.expensesHeader}>
            <Text className={styles.expensesTitle}>历史记录</Text>
            <Text className={styles.expensesCount}>
              共{goal.expenses.length}笔 · ¥{goal.usedBudget.toLocaleString()}
            </Text>
          </View>
          
          {goal.expenses.slice(0, 5).map(expense => (
            <View key={expense.id} className={styles.expenseItem}>
              <Text className={styles.expenseIcon}>
                {getCategoryIcon(category)}
              </Text>
              <View className={styles.expenseInfo}>
                <Text className={styles.expenseTitle}>{expense.title}</Text>
                <Text className={styles.expenseMeta}>
                  {expense.date} · {memberNameById(expense.payerId)}支付
                </Text>
              </View>
              <Text className={styles.expenseAmount}>
                -¥{expense.amount.toLocaleString()}
              </Text>
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
          保存
        </Button>
      </View>
    </View>
  );
};

export default ExpenseRecordPage;
