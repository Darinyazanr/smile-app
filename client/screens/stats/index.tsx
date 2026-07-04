/**
 * 今日微笑 - 统计页面
 * 展示微笑趋势图表和统计数据
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSmile } from '@/contexts/SmileContext';
import { SmileRecord } from '@/models/SmileRecord';
import dayjs from 'dayjs';

const WEEKDAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

type Period = 'week' | 'month';

interface DailyStat {
  date: string;
  label: string;
  smiled: boolean | null;
}

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { allRecords, totalDays, streak } = useSmile();
  const [period, setPeriod] = useState<Period>('week');

  // 微笑率
  const smileRate = useMemo(() => {
    if (allRecords.length === 0) return 0;
    const smiledCount = allRecords.filter(r => r.smiled).length;
    return Math.round((smiledCount / allRecords.length) * 100);
  }, [allRecords]);

  // 按周期生成每日统计
  const dailyStats = useMemo((): DailyStat[] => {
    const days = period === 'week' ? 7 : 30;
    const today = dayjs();
    const recordMap = new Map<string, SmileRecord>();
    allRecords.forEach(r => recordMap.set(r.date, r));

    return Array.from({ length: days }, (_, i) => {
      const date = today.subtract(days - 1 - i, 'day');
      const dateStr = date.format('YYYY-MM-DD');
      const record = recordMap.get(dateStr);
      return {
        date: dateStr,
        label: period === 'week' ? WEEKDAY_CN[date.day()] : date.format('MM/DD'),
        smiled: record ? record.smiled : null,
      };
    });
  }, [allRecords, period]);

  // 连续打卡趋势（用于柱状图）
  const maxCount = useMemo(() => {
    const counts = dailyStats.map(d => d.smiled === true ? 1 : 0);
    return Math.max(...counts, 1);
  }, [dailyStats]);

  const getBarColor = useCallback((smiled: boolean | null): string => {
    if (smiled === true) return '#22C55E';
    if (smiled === false) return '#94A3B8';
    return '#E5E7EB';
  }, []);

  const periodStats = useMemo(() => {
    const total = dailyStats.filter(d => d.smiled !== null).length;
    const smiled = dailyStats.filter(d => d.smiled === true).length;
    return { total, smiled, rate: total > 0 ? Math.round((smiled / total) * 100) : 0 };
  }, [dailyStats]);

  return (
    <Screen>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>微笑统计</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 总览卡片 */}
          <View style={styles.overviewCard}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewNumber}>{totalDays}</Text>
              <Text style={styles.overviewLabel}>总打卡</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <Text style={[styles.overviewNumber, { color: '#F59E0B' }]}>{streak}</Text>
              <Text style={styles.overviewLabel}>连续打卡</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <Text style={[styles.overviewNumber, { color: '#22C55E' }]}>{smileRate}%</Text>
              <Text style={styles.overviewLabel}>微笑率</Text>
            </View>
          </View>

          {/* 周期切换 */}
          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[styles.periodButton, period === 'week' && styles.periodButtonActive]}
              onPress={() => setPeriod('week')}
            >
              <Text style={[styles.periodText, period === 'week' && styles.periodTextActive]}>
                本周
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodButton, period === 'month' && styles.periodButtonActive]}
              onPress={() => setPeriod('month')}
            >
              <Text style={[styles.periodText, period === 'month' && styles.periodTextActive]}>
                本月
              </Text>
            </TouchableOpacity>
          </View>

          {/* 周期统计 */}
          <View style={styles.periodStatsCard}>
            <Text style={styles.periodStatsTitle}>
              {period === 'week' ? '本周统计' : '本月统计'}
            </Text>
            <View style={styles.periodStatsRow}>
              <View style={styles.periodStatItem}>
                <Text style={styles.periodStatNumber}>{periodStats.total}</Text>
                <Text style={styles.periodStatLabel}>打卡天数</Text>
              </View>
              <View style={styles.periodStatItem}>
                <Text style={[styles.periodStatNumber, { color: '#22C55E' }]}>
                  {periodStats.smiled}
                </Text>
                <Text style={styles.periodStatLabel}>微笑天数</Text>
              </View>
              <View style={styles.periodStatItem}>
                <Text style={[styles.periodStatNumber, { color: '#F59E0B' }]}>
                  {periodStats.rate}%
                </Text>
                <Text style={styles.periodStatLabel}>微笑率</Text>
              </View>
            </View>
          </View>

          {/* 柱状图 */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>
              {period === 'week' ? '本周趋势' : '本月趋势'}
            </Text>
            <View style={styles.chartContainer}>
              <View style={styles.chartBars}>
                {dailyStats.map((day, index) => {
                  const barHeight = day.smiled === true
                    ? '100%'
                    : day.smiled === false
                      ? '25%'
                      : '8%';
                  return (
                    <View key={index} style={styles.barColumn}>
                      <View style={styles.barWrapper}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: barHeight,
                              backgroundColor: getBarColor(day.smiled),
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[styles.barLabel, period === 'month' && styles.barLabelSmall]}
                        numberOfLines={1}
                      >
                        {day.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* 图例 */}
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
                <Text style={styles.legendText}>笑了</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#94A3B8' }]} />
                <Text style={styles.legendText}>没笑</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#E5E7EB' }]} />
                <Text style={styles.legendText}>未打卡</Text>
              </View>
            </View>
          </View>

          {/* 小贴士 */}
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>小贴士</Text>
            <Text style={styles.tipText}>
              {smileRate >= 80
                ? '你的微笑率很高！继续保持乐观心态~'
                : smileRate >= 50
                  ? '生活有笑有泪，这才是真实的你。'
                  : '试着每天找一件值得微笑的小事吧！'}
            </Text>
          </View>
        </ScrollView>
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
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerRight: { width: 32 },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // 总览卡片
  overviewCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  overviewDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 10,
  },
  // 周期切换
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  periodButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  periodTextActive: {
    color: '#1F2937',
    fontWeight: '600',
  },
  // 周期统计
  periodStatsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  periodStatsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
  },
  periodStatsRow: {
    flexDirection: 'row',
  },
  periodStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  periodStatNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  periodStatLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  // 图表
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 16,
  },
  chartContainer: {
    height: 180,
    marginBottom: 8,
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barWrapper: {
    width: '60%',
    height: 120,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  barLabelSmall: {
    fontSize: 8,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
    color: '#64748B',
  },
  // 小贴士
  tipCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
});
