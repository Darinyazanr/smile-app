/**
 * 今日微笑 - 首页
 * 核心功能：今日打卡、查看统计
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Image,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Link } from 'expo-router';
import { useSmile } from '@/contexts/SmileContext';
import dayjs from 'dayjs';
import { Ionicons } from '@expo/vector-icons';
import { MoodEmoji } from '@/components/Emoji';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { todayRecord, streak, totalDays, saveRecord, isLoading } = useSmile();
  
  // 状态
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMood, setSelectedMood] = useState<boolean | null>(null);
  const [reason, setReason] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 打开录入浮层
  const handleMoodSelect = useCallback((smiled: boolean) => {
    setSelectedMood(smiled);
    setReason(todayRecord?.reason || '');
    setPhotoUri(todayRecord?.photoPath || null);
    setModalVisible(true);
  }, [todayRecord]);

  // 选择照片
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

  // 拍照
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

  // 提交记录
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await saveRecord(selectedMood!, reason.trim() || undefined, photoUri || undefined);
      setModalVisible(false);
      // 重置状态
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

  // 取消
  const handleCancel = useCallback(() => {
    setModalVisible(false);
    setSelectedMood(null);
    setReason('');
    setPhotoUri(null);
  }, []);

  const isCheckedIn = !!todayRecord;

  return (
    <Screen>
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>今日微笑</Text>
          <Text style={styles.date}>{dayjs().format('MM月DD日 dddd')}</Text>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{streak}</Text>
            <Text style={styles.statLabel}>连续打卡</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalDays}</Text>
            <Text style={styles.statLabel}>总打卡</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: todayRecord?.smiled ? '#22C55E' : '#94A3B8' }]}>
              {todayRecord ? <MoodEmoji type={todayRecord.smiled ? 'smiled' : 'notSmiled'} /> : '-'}
            </Text>
            <Text style={styles.statLabel}>今日状态</Text>
          </View>
        </View>

        {/* Main Check-in Area */}
        <View style={styles.mainArea}>
          {isCheckedIn ? (
            <View style={styles.checkedInContainer}>
              <Text style={styles.checkedInEmoji}>
                <MoodEmoji type={todayRecord!.smiled ? 'smiled' : 'notSmiled'} />
              </Text>
              <Text style={styles.checkedInTitle}>
                今日已打卡
              </Text>
              <Text style={styles.checkedInSubtitle}>
                {todayRecord!.smiled ? '今天你笑得很开心！' : '没关系，明天继续加油！'}
              </Text>
              {todayRecord!.reason && (
                <View style={styles.reasonCard}>
                  <Text style={styles.reasonLabel}>记录原因</Text>
                  <Text style={styles.reasonText}>{todayRecord!.reason}</Text>
                </View>
              )}
              {todayRecord!.photoPath && (
                <Image source={{ uri: todayRecord!.photoPath }} style={styles.recordPhoto} />
              )}
              <TouchableOpacity
                style={styles.changeButton}
                onPress={() => handleMoodSelect(todayRecord!.smiled)}
              >
                <Text style={styles.changeButtonText}>修改记录</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.notCheckedInContainer}>
              <Text style={styles.questionText}>今天笑了吗？</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.moodButton, styles.smiledButton]}
                  onPress={() => handleMoodSelect(true)}
                  activeOpacity={0.8}
                >
                  <MoodEmoji type="smiled" style={styles.moodEmoji} />
                  <Text style={styles.moodText}>笑了</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.moodButton, styles.notSmiledButton]}
                  onPress={() => handleMoodSelect(false)}
                  activeOpacity={0.8}
                >
                  <MoodEmoji type="notSmiled" style={styles.moodEmoji} />
                  <Text style={styles.moodText}>没笑</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Bottom Navigation */}
        <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 10 }]}>
          <Link href="/calendar" asChild>
            <TouchableOpacity style={styles.navItem}>
              <Ionicons name="calendar-outline" size={24} color="#64748B" />
              <Text style={styles.navText}>打卡日历</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/settings" asChild>
            <TouchableOpacity style={styles.navItem}>
              <Ionicons name="settings-outline" size={24} color="#64748B" />
              <Text style={styles.navText}>设置</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Reason Input Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCancel}
        >
          <KeyboardAvoidingView
            style={styles.modalContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={handleCancel}
            />
            <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.modalHandle} />
              
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedMood ? (selectedMood ? <MoodEmoji type="smiled" /> : <MoodEmoji type="notSmiled" />) : ''}
                  {selectedMood ? (selectedMood ? '记录今日微笑' : '记录今天') : ''}
                </Text>
                <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* 原因输入 */}
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>简短描述（可选）</Text>
                  <TextInput
                    style={styles.reasonInput}
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

                {/* 照片上传 */}
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>添加照片（可选）</Text>
                  <View style={styles.photoButtons}>
                    <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
                      <Ionicons name="images-outline" size={24} color="#64748B" />
                      <Text style={styles.photoButtonText}>相册</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                      <Ionicons name="camera-outline" size={24} color="#64748B" />
                      <Text style={styles.photoButtonText}>拍照</Text>
                    </TouchableOpacity>
                  </View>
                  {photoUri && (
                    <View style={styles.photoPreview}>
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

              {/* 提交按钮 */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? '保存中...' : '保存记录'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#64748B',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 10,
  },
  mainArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  notCheckedInContainer: {
    alignItems: 'center',
  },
  questionText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 30,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 20,
  },
  moodButton: {
    width: 140,
    height: 140,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  smiledButton: {
    backgroundColor: '#FEF3C7',
  },
  notSmiledButton: {
    backgroundColor: '#F1F5F9',
  },
  moodEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  moodText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  checkedInContainer: {
    alignItems: 'center',
  },
  checkedInEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  checkedInTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  checkedInSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 20,
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
  reasonLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#374151',
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
  changeButtonText: {
    fontSize: 14,
    color: '#64748B',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  navText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  // Modal 样式
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  reasonInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 80,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
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
  photoButtonText: {
    fontSize: 14,
    color: '#64748B',
  },
  photoPreview: {
    marginTop: 12,
    position: 'relative',
    alignSelf: 'center',
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
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  submitButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#FCD34D',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
