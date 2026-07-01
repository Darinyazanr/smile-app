/**
 * 今日微笑 - 通知服务
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { NotificationSettings } from '../models/SmileRecord';
import { SMILE } from '../components/Emoji';

// 配置通知处理
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * 请求通知权限
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('Notifications are only available on physical devices');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permission not granted');
    return false;
  }

  // Android 特定配置
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-reminder', {
      name: '每日提醒',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFD700',
    });
  }

  return true;
}

/**
 * 安排每日提醒
 */
export async function scheduleDailyReminder(settings: NotificationSettings): Promise<void> {
  // 先取消所有现有提醒
  await cancelAllReminders();

  if (!settings.enabled) {
    return;
  }

  // 计算下次提醒时间
  const now = new Date();
  const scheduledDate = new Date();
  scheduledDate.setHours(settings.hour, settings.minute, 0, 0);

  // 如果已过今天提醒时间，则安排明天
  if (scheduledDate <= now) {
    scheduledDate.setDate(scheduledDate.getDate() + 1);
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `今日微笑 ${SMILE}`,
      body: '今天你笑了吗？来记录一下吧！',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: settings.hour,
      minute: settings.minute,
    },
  });

  console.log('Daily reminder scheduled for', scheduledDate.toISOString());
}

/**
 * 取消所有提醒
 */
export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * 获取所有待发送的通知
 */
export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}
