/**
 * 今日微笑 - 打卡日历页
 * 热力图风格展示历史打卡记录
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { useSmile } from '@/contexts/SmileContext';
import { SmileRecord } from '@/models/SmileRecord';
import { MoodEmoji } from '@/components/Emoji';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

interface DayData {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  record?: SmileRecord;
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { allRecords, todayRecord } = useSmile();
  
  // 当前查看的月份
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  // 选中的日期
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // 将记录转为 Map 方便查找
  const recordMap = useMemo(() => {
    const map = new Map<string, SmileRecord>();
    allRecords.forEach(record => map.set(record.date, record));
    return map;
  }, [allRecords]);

  // 获取选中日期的记录
  const selectedRecord = useMemo(() => {
    if (!selectedDate) return null;
    return recordMap.get(selectedDate) || null;
  }, [selectedDate, recordMap]);

  // 生成当月日历数据
  const calendarDays = useMemo((): DayData[] => {
    const year = currentMonth.year();
    const month = currentMonth.month();
    const firstDay = dayjs().year(year).month(month).startOf('month');
    const lastDay = firstDay.endOf('month');
    const startWeekday = firstDay.day();
    const daysInMonth = lastDay.date();

    const days: DayData[] = [];

    // 上月填充
    const prevMonth = firstDay.subtract(1, 'month');
    const prevMonthDays = prevMonth.daysInMonth();
    for (let i = startWeekday - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const date = prevMonth.date(day).format('YYYY-MM-DD');
      days.push({
        date,
        day,
        isCurrentMonth: false,
        record: recordMap.get(date),
      });
    }

    // 当月
    for (let day = 1; day <= daysInMonth; day++) {
      const date = firstDay.date(day).format('YYYY-MM-DD');
      days.push({
        date,
        day,
        isCurrentMonth: true,
        record: recordMap.get(date),
      });
    }

    // 下月填充
    const remainingDays = 42 - days.length; // 6行 x 7天
    const nextMonth = lastDay.add(1, 'day');
    for (let day = 1; day <= remainingDays; day++) {
      const date = nextMonth.date(day).format('YYYY-MM-DD');
      days.push({
        date,
        day,
        isCurrentMonth: false,
        record: recordMap.get(date),
      });
    }

    return days;
  }, [currentMonth, recordMap]);

  // 上一个月
  const goToPrevMonth = useCallback(() => {
    setCurrentMonth(prev => prev.subtract(1, 'month'));
  }, []);

  // 下一个月
  const goToNextMonth = useCallback(() => {
    const nextMonth = currentMonth.add(1, 'month');
    const today = dayjs();
    if (nextMonth.isBefore(today, 'month') || nextMonth.isSame(today, 'month')) {
      setCurrentMonth(nextMonth);
    }
  }, [currentMonth]);

  // 点击日期
  const handleDayPress = useCallback((day: DayData) => {
    if (!day.isCurrentMonth) return;
    
    // 不能查看未来日期
    const dayDate = dayjs(day.date);
    const today = dayjs();
    if (dayDate.isAfter(today, 'day')) return;

    setSelectedDate(day.date);
    setDetailModalVisible(true);
  }, []);

  // 获取日期方块颜色
  const getDayColor = (day: DayData): string => {
    if (!day.isCurrentMonth) return 'transparent';
    
    const dayDate = dayjs(day.date);
    const today = dayjs();
    
    // 未来日期
    if (dayDate.isAfter(today, 'day')) return '#F1F5F9';
    
    // 今日
    if (dayDate.isSame(today, 'day')) {
      return '#FEF3C7';
    }

    // 有记录
    if (day.record) {
      return day.record.smiled ? '#DCFCE7' : '#F1F5F9';
    }

    return 'transparent';
  };

  // 获取日期文字颜色
  const getDayTextColor = (day: DayData): string => {
    if (!day.isCurrentMonth) return '#CBD5E1';
    
    const dayDate = dayjs(day.date);
    const today = dayjs();
    
    if (dayDate.isAfter(today, 'day')) return '#94A3B8';
    if (dayDate.isSame(today, 'day')) return '#F59E0B';
    
    return '#374151';
  };

  // 判断是否可点击
  const canClick = (day: DayData): boolean => {
    if (!day.isCurrentMonth) return false;
    const dayDate = dayjs(day.date);
    const today = dayjs();
    return !dayDate.isAfter(today, 'day');
  };

  // 是否可右滑
  const canGoNext = useMemo(() => {
    const nextMonth = currentMonth.add(1, 'month');
    const today = dayjs();
    return nextMonth.isBefore(today, 'month') || nextMonth.isSame(today, 'month');
  }, [currentMonth]);

  return (
    <Screen>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>打卡日历</Text>
          <View style={styles.headerRight} />
        </View>

        {/* 月份切换 */}
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={goToPrevMonth} style={styles.arrowButton}>
            <Ionicons name="chevron-back" size={24} color="#64748B" />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {currentMonth.year()}年 {MONTHS[currentMonth.month()]}
          </Text>
          <TouchableOpacity 
            onPress={goToNextMonth} 
            style={[styles.arrowButton, !canGoNext && styles.arrowDisabled]}
            disabled={!canGoNext}
          >
            <Ionicons 
              name="chevron-forward" 
              size={24} 
              color={canGoNext ? '#64748B' : '#CBD5E1'} 
            />
          </TouchableOpacity>
        </View>

        {/* 图例 */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#DCFCE7' }]} />
            <Text style={styles.legendText}>笑了</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F1F5F9' }]} />
            <Text style={styles.legendText}>没笑/未打卡</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FEF3C7' }]} />
            <Text style={styles.legendText}>今天</Text>
          </View>
        </View>

        {/* 星期标题 */}
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((day, index) => (
            <View key={index} style={styles.weekdayCell}>
              <Text style={[styles.weekdayText, index === 0 && styles.weekendText]}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* 日历网格 */}
        <ScrollView style={styles.calendarScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  { backgroundColor: getDayColor(day) },
                  day.date === selectedDate && styles.selectedDay,
                ]}
                onPress={() => handleDayPress(day)}
                disabled={!canClick(day)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayText, { color: getDayTextColor(day) }]}>
                  {day.day}
                </Text>
                {day.record && (
                  <Text style={styles.moodIndicator}>
                    <MoodEmoji type={day.record.smiled ? 'smiled' : 'notSmiled'} />
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* 统计摘要 */}
        <View style={[styles.summary, { paddingBottom: insets.bottom + 10 }]}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{allRecords.length}</Text>
            <Text style={styles.summaryLabel}>总打卡</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: '#22C55E' }]}>
              {allRecords.filter(r => r.smiled).length}
            </Text>
            <Text style={styles.summaryLabel}>笑了</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: '#94A3B8' }]}>
              {allRecords.filter(r => !r.smiled).length}
            </Text>
            <Text style={styles.summaryLabel}>没笑</Text>
          </View>
        </View>

        {/* 详情弹窗 */}
        <Modal
          visible={detailModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setDetailModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setDetailModalVisible(false)}
          />
          <View style={[styles.detailModal, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.detailHandle} />
            
            {selectedRecord ? (
              <>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailDate}>
                    {dayjs(selectedDate).format('YYYY年MM月DD日')}
                  </Text>
                  <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailContent}>
                  <View style={styles.detailMood}>
                    <MoodEmoji type={selectedRecord.smiled ? 'smiled' : 'notSmiled'} style={styles.detailEmoji} />
                    <Text style={styles.detailMoodText}>
                      {selectedRecord.smiled ? '今天笑了' : '今天没笑'}
                    </Text>
                  </View>

                  {selectedRecord.reason && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>记录原因</Text>
                      <Text style={styles.detailText}>{selectedRecord.reason}</Text>
                    </View>
                  )}

                  {selectedRecord.photoPath && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>记录照片</Text>
                      <Image 
                        source={{ uri: selectedRecord.photoPath }} 
                        style={styles.detailPhoto}
                        resizeMode="cover"
                      />
                    </View>
                  )}
                </View>
              </>
            ) : (
              <>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailDate}>
                    {dayjs(selectedDate).format('YYYY年MM月DD日')}
                  </Text>
                  <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#64748B" />
                  </TouchableOpacity>
                </View>
                <View style={styles.noRecordContainer}>
                  <Text style={styles.noRecordText}>当天没有打卡记录</Text>
                  <Link 
                    href="/" 
                    asChild
                    onPress={() => setDetailModalVisible(false)}
                  >
                    <TouchableOpacity style={styles.goCheckInButton}>
                      <Text style={styles.goCheckInText}>去打卡</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </>
            )}
          </View>
        </Modal>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerRight: {
    width: 32,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  arrowButton: {
    padding: 8,
  },
  arrowDisabled: {
    opacity: 0.5,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#64748B',
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  weekendText: {
    color: '#EF4444',
  },
  calendarScroll: {
    flex: 1,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedDay: {
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  moodIndicator: {
    fontSize: 10,
    marginTop: 2,
  },
  summary: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
    marginTop: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  // Modal 样式
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  detailModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    minHeight: 300,
  },
  detailHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  detailContent: {
    padding: 20,
  },
  detailMood: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailEmoji: {
    fontSize: 40,
    marginRight: 12,
  },
  detailMoodText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  detailPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  noRecordContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noRecordText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 16,
  },
  goCheckInButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  goCheckInText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
