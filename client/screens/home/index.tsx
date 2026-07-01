/**
 * 今日微笑 - 首页
 * 核心功能：今日打卡、查看统计
 * 样式方案：Tailwind (className) 为主，复杂阴影/动画保留 StyleSheet
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { BottomSheet } from '@/components/BottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Link } from 'expo-router';
import { useSmile } from '@/contexts/SmileContext';
import dayjs from 'dayjs';
import { Ionicons } from '@expo/vector-icons';
import { MoodEmoji } from '@/components/Emoji';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorScreen } from '@/components/ErrorScreen';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { todayRecord, streak, totalDays, saveRecord, isLoading, error, refreshData } = useSmile();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMood, setSelectedMood] = useState<boolean | null>(null);
  const [reason, setReason] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 加载态
  if (isLoading) {
    return <LoadingScreen message="正在加载今日微笑..." />;
  }

  // 错误态
  if (error) {
    return <ErrorScreen message={error} onRetry={refreshData} />;
  }

  const handleMoodSelect = useCallback((smiled: boolean) => {
    setSelectedMood(smiled);
    setReason(todayRecord?.reason || '');
    setPhotoUri(todayRecord?.photoPath || null);
    setModalVisible(true);
  }, [todayRecord]);

  const handlePickImage = useCallback(async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('提示', '需要相册权限才能选择照片');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }, []);

  const handleTakePhoto = useCallback(async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('提示', '需要相机权限才能拍照');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await saveRecord(selectedMood!, reason.trim() || undefined, photoUri || undefined);
      setModalVisible(false);
      setSelectedMood(null);
      setReason('');
      setPhotoUri(null);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('保存失败', '请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedMood, reason, photoUri, saveRecord, isSubmitting]);

  const handleCancel = useCallback(() => {
    setModalVisible(false);
    setSelectedMood(null);
    setReason('');
    setPhotoUri(null);
  }, []);

  const isCheckedIn = !!todayRecord;

  return (
    <Screen>
      <View className="flex-1 bg-[#FAFAFA]" style={{ paddingTop: insets.top + 20 }}>
        {/* Header */}
        <View className="items-center px-5 mb-5">
          <Text className="text-[28px] font-bold text-[#1F2937] mb-1">今日微笑</Text>
          <Text className="text-sm text-[#64748B]">{dayjs().format('MM月DD日 dddd')}</Text>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard} className="mx-5">
          <View className="flex-1 items-center">
            <Text className="text-[28px] font-bold text-[#F59E0B] mb-1">{streak}</Text>
            <Text className="text-xs text-[#64748B]">连续打卡</Text>
          </View>
          <View style={styles.statDivider} />
          <View className="flex-1 items-center">
            <Text className="text-[28px] font-bold text-[#F59E0B] mb-1">{totalDays}</Text>
            <Text className="text-xs text-[#64748B]">总打卡</Text>
          </View>
          <View style={styles.statDivider} />
          <View className="flex-1 items-center">
            <Text 
              className="text-[28px] font-bold mb-1"
              style={{ color: todayRecord?.smiled ? '#22C55E' : '#94A3B8' }}
            >
              {todayRecord ? <MoodEmoji type={todayRecord.smiled ? 'smiled' : 'notSmiled'} /> : '-'}
            </Text>
            <Text className="text-xs text-[#64748B]">今日状态</Text>
          </View>
        </View>

        {/* Main Check-in Area */}
        <View className="flex-1 justify-center px-5">
          {isCheckedIn ? (
            <View className="items-center">
              <Text className="text-[72px] mb-4">
                <MoodEmoji type={todayRecord!.smiled ? 'smiled' : 'notSmiled'} />
              </Text>
              <Text className="text-2xl font-semibold text-[#1F2937] mb-2">今日已打卡</Text>
              <Text className="text-base text-[#64748B] mb-5">
                {todayRecord!.smiled ? '今天你笑得很开心！' : '没关系，明天继续加油！'}
              </Text>
              {todayRecord!.reason && (
                <View style={styles.reasonCard}>
                  <Text className="text-xs text-[#94A3B8] mb-1">记录原因</Text>
                  <Text className="text-sm text-[#374151]">{todayRecord!.reason}</Text>
                </View>
              )}
              {todayRecord!.photoPath && (
                <Image source={{ uri: todayRecord!.photoPath }} style={styles.recordPhoto} />
              )}
              <TouchableOpacity
                style={styles.changeButton}
                onPress={() => handleMoodSelect(todayRecord!.smiled)}
              >
                <Text className="text-sm text-[#64748B]">修改记录</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="items-center">
              <Text className="text-2xl font-semibold text-[#1F2937] mb-[30px]">今天笑了吗？</Text>
              <View className="flex-row gap-5">
                <TouchableOpacity
                  style={styles.smiledButton}
                  onPress={() => handleMoodSelect(true)}
                  activeOpacity={0.8}
                >
                  <MoodEmoji type="smiled" style={styles.moodEmoji} />
                  <Text className="text-lg font-semibold text-[#374151]">笑了</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.notSmiledButton}
                  onPress={() => handleMoodSelect(false)}
                  activeOpacity={0.8}
                >
                  <MoodEmoji type="notSmiled" style={styles.moodEmoji} />
                  <Text className="text-lg font-semibold text-[#374151]">没笑</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Bottom Navigation */}
        <View 
          className="flex-row justify-around bg-white pt-3 border-t border-[#F1F5F9]"
          style={{ paddingBottom: insets.bottom + 10 }}
        >
          <Link href="/calendar" asChild>
            <TouchableOpacity className="items-center px-10">
              <Ionicons name="calendar-outline" size={24} color="#64748B" />
              <Text className="text-xs text-[#64748B] mt-1">打卡日历</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/stats" asChild>
            <TouchableOpacity className="items-center px-10">
              <Ionicons name="stats-chart-outline" size={24} color="#64748B" />
              <Text className="text-xs text-[#64748B] mt-1">微笑统计</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/settings" asChild>
            <TouchableOpacity className="items-center px-10">
              <Ionicons name="settings-outline" size={24} color="#64748B" />
              <Text className="text-xs text-[#64748B] mt-1">设置</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* 打卡录入弹窗 */}
        <BottomSheet visible={modalVisible} onClose={handleCancel}>
          <BottomSheet.Header onClose={handleCancel}>
            <BottomSheet.Title>
              {selectedMood !== null ? (
                <>
                  <MoodEmoji type={selectedMood ? 'smiled' : 'notSmiled'} />{' '}
                  {selectedMood ? '记录今日微笑' : '记录今天'}
                </>
              ) : ''}
            </BottomSheet.Title>
          </BottomSheet.Header>

          <BottomSheet.Body>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="mb-6">
                <Text className="text-sm font-medium text-[#374151] mb-2">简短描述（可选）</Text>
                <TextInput
                  className="bg-[#F9FAFB] rounded-xl p-3.5 text-sm text-[#1F2937]"
                  style={{ minHeight: 80 }}
                  placeholder="今天为什么笑/没笑..."
                  placeholderTextColor="#94A3B8"
                  value={reason}
                  onChangeText={setReason}
                  maxLength={100}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View className="mb-6">
                <Text className="text-sm font-medium text-[#374151] mb-2">添加照片（可选）</Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
                    <Ionicons name="images-outline" size={24} color="#64748B" />
                    <Text className="text-sm text-[#64748B]">相册</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                    <Ionicons name="camera-outline" size={24} color="#64748B" />
                    <Text className="text-sm text-[#64748B]">拍照</Text>
                  </TouchableOpacity>
                </View>
                {photoUri && (
                  <View className="mt-3 relative self-center">
                    <Image source={{ uri: photoUri }} style={styles.photoImage} />
                    <TouchableOpacity
                      style={styles.removePhoto}
                      onPress={() => setPhotoUri(null)}
                    >
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          </BottomSheet.Body>

          <BottomSheet.Footer>
            <TouchableOpacity
              className={`rounded-xl py-3.5 items-center ${isSubmitting ? 'bg-[#FCD34D]' : 'bg-[#F59E0B]'}`}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text className="text-base font-semibold text-white">
                {isSubmitting ? '保存中...' : '保存记录'}
              </Text>
            </TouchableOpacity>
          </BottomSheet.Footer>
        </BottomSheet>
      </View>
    </Screen>
  );
}

// 保留需要阴影/复杂样式的 StyleSheet
const styles = StyleSheet.create({
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 10,
  },
  reasonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recordPhoto: {
    width: 200,
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
  },
  changeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  smiledButton: {
    width: 140,
    height: 140,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  notSmiledButton: {
    width: 140,
    height: 140,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  moodEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  photoImage: {
    width: 150,
    height: 150,
    borderRadius: 12,
  },
  removePhoto: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
});
