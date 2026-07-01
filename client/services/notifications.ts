/**
 * 今日微笑 - 通知服务
 * 
 * 注意：expo-notifications 仅支持 iOS/Android 原生平台，
 * Web 平台所有操作均为空操作（no-op）。
 */
import { Platform } from 'react-native';
import { NotificationSettings } from '../models/SmileRecord';

// 是否为原生平台
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

// 动态导入，Web 上不加载 expo-notifications
let Notifications: any = null;
let Device: any = null;

async function loadNativeModules() {
  if (!isNative) return;
  try {
    Notifications = (await import('expo-notifications')).default || (await import('expo-notifications'));
    Device = (await import('expo-device')).default || (await import('expo-device'));
    
    // 配置通知处理
    if (Notifications?.setNotificationHandler) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch {
    // 加载失败，通知功能不可用
  }
}

// 预加载
loadNativeModules();

/**
 * 请求通知权限
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!isNative || !Device || !Notifications) {
    return false;
  }

  try {
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
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('daily-reminder', {
        name: '每日提醒',
        importance: Notifications.AndroidImportance?.HIGH ?? 4,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFD700',
      });
    }

    return true;
  } catch (error) {
    console.warn('Notification permission error:', error);
    return false;
  }
}

/**
 * 安排每日提醒
 */
export async function scheduleDailyReminder(settings: NotificationSettings): Promise<void> {
  if (!isNative || !Notifications) return;

  try {
    await cancelAllReminders();

    if (!settings.enabled) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '今日微笑 😊',
        body: '今天你笑了吗？来记录一下吧！',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes?.DAILY ?? 'daily',
        hour: settings.hour,
        minute: settings.minute,
      },
    });
  } catch (error) {
    console.warn('Schedule notification error:', error);
  }
}

/**
 * 取消所有提醒
 */
export async function cancelAllReminders(): Promise<void> {
  if (!isNative || !Notifications) return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('Cancel notifications error:', error);
  }
}

/**
 * 获取所有待发送的通知
 */
export async function getAllScheduledNotifications(): Promise<any[]> {
  if (!isNative || !Notifications) return [];

  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch {
    return [];
  }
}
