/**
 * 今日微笑 - 设置页
 * 包含通知提醒设置、分享成就等功能
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Share,
  Platform,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSmile } from '@/contexts/SmileContext';
import { SMILE } from '@/components/Emoji';
import BottomSheet from '@/components/BottomSheet';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { streak, totalDays, notificationSettings, updateNotificationSettings } = useSmile();
  
  // 时间选择器状态
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());
  // 关于弹窗
  const [showAbout, setShowAbout] = useState(false);

  // 切换通知开关
  const handleNotificationToggle = useCallback(async (value: boolean) => {
    await updateNotificationSettings({ enabled: value });
  }, [updateNotificationSettings]);

  // 打开时间选择器
  const handleTimePress = useCallback(() => {
    const now = new Date();
    now.setHours(notificationSettings.hour, notificationSettings.minute, 0, 0);
    setTempTime(now);
    setShowTimePicker(true);
  }, [notificationSettings]);

  // 时间选择确认
  const handleTimeChange = useCallback(async (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      const hour = selectedDate.getHours();
      const minute = selectedDate.getMinutes();
      await updateNotificationSettings({ hour, minute });
    }
  }, [updateNotificationSettings]);

  // 时间选择确认（iOS）
  const handleTimeConfirm = useCallback(async () => {
    const hour = tempTime.getHours();
    const minute = tempTime.getMinutes();
    await updateNotificationSettings({ hour, minute });
    setShowTimePicker(false);
  }, [tempTime, updateNotificationSettings]);

  // 格式化时间
  const formatTime = (hour: number, minute: number): string => {
    const h = hour.toString().padStart(2, '0');
    const m = minute.toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  // 分享成就
  const handleShare = useCallback(async () => {
    const message = `我在「今日微笑」连续打卡 ${streak} 天！\n总共记录了 ${totalDays} 天的微笑。\n\n你也来试试记录每天的微笑吧 ${SMILE}`;
    
    try {
      await Share.share({
        message,
        title: '分享我的打卡成就',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [streak, totalDays]);

  // 关于
  const handleAbout = useCallback(() => {
    setShowAbout(true);
  }, []);

  return (
    <Screen>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>设置</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.content}>
          {/* 成就卡片 */}
          <View style={styles.achievementCard}>
            <Text style={styles.achievementTitle}>我的成就</Text>
            <View style={styles.achievementStats}>
              <View style={styles.achievementItem}>
                <Text style={styles.achievementNumber}>{streak}</Text>
                <Text style={styles.achievementLabel}>连续打卡</Text>
              </View>
              <View style={styles.achievementDivider} />
              <View style={styles.achievementItem}>
                <Text style={styles.achievementNumber}>{totalDays}</Text>
                <Text style={styles.achievementLabel}>总打卡</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color="#F59E0B" />
              <Text style={styles.shareButtonText}>分享成就</Text>
            </TouchableOpacity>
          </View>

          {/* 提醒设置 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>提醒设置</Text>
            <View style={styles.settingCard}>
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="notifications-outline" size={22} color="#64748B" />
                  <Text style={styles.settingText}>每日提醒</Text>
                </View>
                <Switch
                  value={notificationSettings.enabled}
                  onValueChange={handleNotificationToggle}
                  trackColor={{ false: '#E5E7EB', true: '#FCD34D' }}
                  thumbColor={notificationSettings.enabled ? '#F59E0B' : '#94A3B8'}
                />
              </View>

              <View style={styles.settingDivider} />

              <TouchableOpacity 
                style={styles.settingItem}
                onPress={handleTimePress}
                disabled={!notificationSettings.enabled}
              >
                <View style={styles.settingLeft}>
                  <Ionicons name="time-outline" size={22} color="#64748B" />
                  <Text style={[
                    styles.settingText,
                    !notificationSettings.enabled && styles.settingTextDisabled
                  ]}>
                    提醒时间
                  </Text>
                </View>
                <View style={styles.settingRight}>
                  <Text style={[
                    styles.settingValue,
                    !notificationSettings.enabled && styles.settingValueDisabled
                  ]}>
                    {formatTime(notificationSettings.hour, notificationSettings.minute)}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                </View>
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>
              每天 {formatTime(notificationSettings.hour, notificationSettings.minute)} 会收到提醒
            </Text>
          </View>

          {/* 其他设置 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>其他</Text>
            <View style={styles.settingCard}>
              <TouchableOpacity style={styles.settingItem} onPress={handleAbout}>
                <View style={styles.settingLeft}>
                  <Ionicons name="information-circle-outline" size={22} color="#64748B" />
                  <Text style={styles.settingText}>关于</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 时间选择器弹窗 (Android) */}
        {showTimePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={tempTime}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={handleTimeChange}
          />
        )}

        {/* 时间选择器弹窗 (iOS) */}
        {showTimePicker && Platform.OS === 'ios' && (
          <View style={styles.iosPickerOverlay}>
            <TouchableOpacity 
              style={styles.iosPickerBackdrop} 
              onPress={() => setShowTimePicker(false)} 
            />
            <View style={[styles.iosPickerContainer, { paddingBottom: insets.bottom }]}>
              <View style={styles.iosPickerHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.iosPickerCancel}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleTimeConfirm}>
                  <Text style={styles.iosPickerConfirm}>确认</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempTime}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={(event, date) => date && setTempTime(date)}
                style={styles.iosPicker}
              />
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
          <Text style={styles.footerText}>今日微笑 v{Constants.expoConfig?.version || '1.0.0'}</Text>
          <Text style={styles.footerSubtext}>保持微笑每一天 {SMILE}</Text>
        </View>

        {/* 关于弹窗 */}
        <BottomSheet visible={showAbout} onClose={() => setShowAbout(false)}>
          <BottomSheet.Header onClose={() => setShowAbout(false)}>
            <BottomSheet.Title>关于「今日微笑」</BottomSheet.Title>
          </BottomSheet.Header>
          <BottomSheet.Body>
            {/* App 图标和理念 */}
            <View style={styles.aboutIconRow}>
              <View style={styles.aboutIconBox}>
                <Text style={styles.aboutIconEmoji}>{SMILE}</Text>
              </View>
              <View style={styles.aboutIconText}>
                <Text style={styles.aboutAppName}>今日微笑</Text>
                <Text style={styles.aboutTagline}>每天问自己一次，今天你笑了吗？</Text>
              </View>
            </View>

            {/* 分割线 */}
            <View style={styles.aboutDivider} />

            {/* 核心理念 */}
            <Text style={styles.aboutSectionLabel}>核心理念</Text>
            <Text style={styles.aboutParagraph}>
              生活不总是一帆风顺，但每一天都值得被记录。
              我们相信，关注情绪是善待自己的开始——
              无论今天笑了还是没笑，都是真实的你。
            </Text>
            <Text style={styles.aboutParagraph}>
              一个简单的打卡动作，帮你看见情绪的变化，
              在微笑的日子里感恩，在低落的日子里觉察。
            </Text>

            {/* 功能亮点 */}
            <Text style={styles.aboutSectionLabel}>功能亮点</Text>
            <View style={styles.aboutFeatureList}>
              <View style={styles.aboutFeatureItem}>
                <Ionicons name="checkmark-circle" size={18} color="#F59E0B" />
                <Text style={styles.aboutFeatureText}>每日一键打卡，记录笑与不笑</Text>
              </View>
              <View style={styles.aboutFeatureItem}>
                <Ionicons name="checkmark-circle" size={18} color="#F59E0B" />
                <Text style={styles.aboutFeatureText}>日历视图，回顾每月的情绪轨迹</Text>
              </View>
              <View style={styles.aboutFeatureItem}>
                <Ionicons name="checkmark-circle" size={18} color="#F59E0B" />
                <Text style={styles.aboutFeatureText}>微笑统计，看见自己的坚持与变化</Text>
              </View>
              <View style={styles.aboutFeatureItem}>
                <Ionicons name="checkmark-circle" size={18} color="#F59E0B" />
                <Text style={styles.aboutFeatureText}>每日提醒，不错过每一个微笑瞬间</Text>
              </View>
              <View style={styles.aboutFeatureItem}>
                <Ionicons name="checkmark-circle" size={18} color="#F59E0B" />
                <Text style={styles.aboutFeatureText}>照片记录，为心情附上一张画面</Text>
              </View>
            </View>

            {/* 版本信息 */}
            <View style={styles.aboutDivider} />
            <View style={styles.aboutMetaRow}>
              <Text style={styles.aboutMetaLabel}>版本</Text>
              <Text style={styles.aboutMetaValue}>{Constants.expoConfig?.version || '1.0.0'}</Text>
            </View>
            <View style={styles.aboutMetaRow}>
              <Text style={styles.aboutMetaLabel}>技术</Text>
              <Text style={styles.aboutMetaValue}>Expo · React Native · Supabase</Text>
            </View>
            <View style={styles.aboutMetaRow}>
              <Text style={styles.aboutMetaLabel}>设计</Text>
              <Text style={styles.aboutMetaValue}>极简 · 温暖 · 专注</Text>
            </View>

            {/* 结尾语 */}
            <View style={styles.aboutClosing}>
              <Text style={styles.aboutClosingText}>
                愿你每天都有一万个理由微笑 {SMILE}
              </Text>
            </View>
          </BottomSheet.Body>
        </BottomSheet>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  achievementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  achievementStats: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  achievementItem: {
    flex: 1,
    alignItems: 'center',
  },
  achievementNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 4,
  },
  achievementLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  achievementDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingVertical: 12,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    marginLeft: 4,
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 15,
    color: '#1F2937',
  },
  settingTextDisabled: {
    color: '#94A3B8',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingValue: {
    fontSize: 15,
    color: '#64748B',
  },
  settingValueDisabled: {
    color: '#CBD5E1',
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 50,
  },
  hint: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
    marginLeft: 4,
  },
  // iOS Picker
  iosPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  iosPickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  iosPickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  iosPickerCancel: {
    fontSize: 15,
    color: '#64748B',
  },
  iosPickerConfirm: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F59E0B',
  },
  iosPicker: {
    height: 200,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 2,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  // 关于弹窗样式
  aboutIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  aboutIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  aboutIconEmoji: {
    fontSize: 28,
  },
  aboutIconText: {
    flex: 1,
  },
  aboutAppName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  aboutTagline: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  aboutDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 18,
  },
  aboutSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  aboutParagraph: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 12,
  },
  aboutFeatureList: {
    gap: 10,
  },
  aboutFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aboutFeatureText: {
    fontSize: 14,
    color: '#334155',
  },
  aboutMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  aboutMetaLabel: {
    fontSize: 13,
    color: '#94A3B8',
  },
  aboutMetaValue: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  aboutClosing: {
    marginTop: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    alignItems: 'center',
  },
  aboutClosingText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
    lineHeight: 20,
  },
});
