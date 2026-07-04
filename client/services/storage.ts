/**
 * 今日微笑 - 本地存储服务
 * 使用 AsyncStorage 作为本地数据库
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import dayjs from 'dayjs';
import { SmileRecord, AppSettings, NotificationSettings } from '../models/SmileRecord';

// 存储键
const STORAGE_KEYS = {
  RECORDS: 'smile_records',
  SETTINGS: 'smile_settings',
};

// 照片存储目录（仅 Native 使用）
const PHOTOS_DIR = Platform.OS === 'web' ? '' : `${FileSystem.cacheDirectory}smile_photos/`;

// 默认通知设置
const DEFAULT_NOTIFICATION: NotificationSettings = {
  enabled: true,
  hour: 21,
  minute: 0,
};

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 获取今天的日期字符串
 */
export function getTodayDate(): string {
  return dayjs().format('YYYY-MM-DD');
}

/**
 * 确保照片目录存在（仅 Native）
 */
async function ensurePhotosDir(): Promise<void> {
  if (Platform.OS === 'web') return;
  
  const dirInfo = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
}

class StorageService {
  private recordsCache: Map<string, SmileRecord> = new Map();
  private settingsCache: AppSettings | null = null;
  private initialized = false;

  constructor() {}

  /**
   * 初始化，加载缓存
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // 确保照片目录存在（仅 Native）
      await ensurePhotosDir();

      // 加载打卡记录
      const recordsJson = await AsyncStorage.getItem(STORAGE_KEYS.RECORDS);
      if (recordsJson) {
        const records: SmileRecord[] = JSON.parse(recordsJson);
        records.forEach(record => {
          this.recordsCache.set(record.date, record);
        });
      }

      // 加载设置
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settingsJson) {
        this.settingsCache = JSON.parse(settingsJson);
      } else {
        this.settingsCache = { notification: DEFAULT_NOTIFICATION };
      }

      this.initialized = true;
    } catch (error) {
      console.error('Storage init error:', error);
      throw error;
    }
  }

  /**
   * 保存所有记录到本地
   */
  private async saveRecords(): Promise<void> {
    const records = Array.from(this.recordsCache.values());
    await AsyncStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  }

  /**
   * 保存设置到本地
   */
  private async saveSettings(): Promise<void> {
    if (this.settingsCache) {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settingsCache));
    }
  }

  /**
   * 获取今天的打卡记录
   */
  async getTodayRecord(): Promise<SmileRecord | null> {
    const today = getTodayDate();
    return this.recordsCache.get(today) || null;
  }

  /**
   * 打卡
   */
  async checkIn(smiled: boolean, reason?: string, photoUri?: string): Promise<SmileRecord> {
    const today = getTodayDate();
    let photoPath: string | undefined;

    // 如果有照片，复制到存储目录（仅 Native）
    if (photoUri && Platform.OS !== 'web') {
      photoPath = await this.savePhoto(photoUri);
    }

    const record: SmileRecord = {
      id: generateId(),
      date: today,
      smiled,
      reason,
      photoPath,
      createdAt: Date.now(),
    };

    this.recordsCache.set(today, record);
    await this.saveRecords();
    return record;
  }

  /**
   * 保存或更新打卡记录（支持指定日期）
   * Context 层调用的统一入口
   */
  async saveRecord(date: string, smiled: boolean, reason?: string, photoUri?: string): Promise<SmileRecord> {
    let photoPath: string | undefined;
    const existing = this.recordsCache.get(date);

    // 如果照片路径没变（修改记录时未换照片），直接复用已有路径，避免重复 copyAsync 失败
    if (photoUri && existing?.photoPath === photoUri) {
      photoPath = existing.photoPath;
    } else if (photoUri && Platform.OS !== 'web') {
      photoPath = await this.savePhoto(photoUri);
    } else if (!photoPath && existing?.photoPath) {
      // 没有新照片时保留旧照片
      photoPath = existing.photoPath;
    }

    const record: SmileRecord = {
      id: existing?.id || generateId(),
      date,
      smiled,
      reason,
      photoPath,
      createdAt: existing?.createdAt || Date.now(),
    };

    this.recordsCache.set(date, record);
    await this.saveRecords();
    return record;
  }

  /**
   * 删除指定日期的打卡记录
   */
  async deleteRecord(date: string): Promise<void> {
    const record = this.recordsCache.get(date);
    if (record?.photoPath) {
      await this.deletePhoto(record.photoPath);
    }
    this.recordsCache.delete(date);
    await this.saveRecords();
  }

  /**
   * 保存照片到本地（仅 Native）
   */
  private async savePhoto(sourceUri: string): Promise<string> {
    if (Platform.OS === 'web') return sourceUri;
    
    try {
      await ensurePhotosDir();
      const fileName = `smile_${Date.now()}.jpg`;
      const destPath = `${PHOTOS_DIR}${fileName}`;
      await FileSystem.copyAsync({ from: sourceUri, to: destPath });
      return destPath;
    } catch (error) {
      console.error('Error saving photo:', error);
      throw error;
    }
  }

  /**
   * 删除照片（仅 Native）
   */
  async deletePhoto(photoPath: string): Promise<void> {
    if (Platform.OS === 'web') return;
    
    try {
      const info = await FileSystem.getInfoAsync(photoPath);
      if (info.exists) {
        await FileSystem.deleteAsync(photoPath);
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  }

  /**
   * 获取所有记录
   */
  async getAllRecords(): Promise<SmileRecord[]> {
    return Array.from(this.recordsCache.values()).sort(
      (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
    );
  }

  /**
   * 获取指定日期的记录
   */
  async getRecordByDate(date: string): Promise<SmileRecord | null> {
    return this.recordsCache.get(date) || null;
  }

  /**
   * 获取指定月份的所有记录
   */
  async getRecordsByMonth(year: number, month: number): Promise<SmileRecord[]> {
    const startOfMonth = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
    const endOfMonth = startOfMonth.endOf('month');
    
    return Array.from(this.recordsCache.values()).filter(record => {
      const recordDate = dayjs(record.date);
      return recordDate.isAfter(startOfMonth.subtract(1, 'day')) && 
             recordDate.isBefore(endOfMonth.add(1, 'day'));
    });
  }

  /**
   * 获取连续打卡天数
   */
  async getStreak(): Promise<number> {
    const records = await this.getAllRecords();
    if (records.length === 0) return 0;

    let streak = 0;
    let currentDate = dayjs();

    // 检查今天是否打卡
    const todayRecord = records.find(r => r.date === getTodayDate());
    if (!todayRecord) {
      // 今天没打卡，检查昨天
      currentDate = currentDate.subtract(1, 'day');
    }

    while (true) {
      const dateStr = currentDate.format('YYYY-MM-DD');
      const record = records.find(r => r.date === dateStr);
      
      if (record) {
        streak++;
        currentDate = currentDate.subtract(1, 'day');
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * 获取总打卡天数
   */
  async getTotalDays(): Promise<number> {
    return this.recordsCache.size;
  }

  /**
   * 获取设置
   */
  async getSettings(): Promise<AppSettings> {
    if (!this.settingsCache) {
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settingsJson) {
        this.settingsCache = JSON.parse(settingsJson);
      } else {
        this.settingsCache = { notification: DEFAULT_NOTIFICATION };
      }
    }
    return this.settingsCache;
  }

  /**
   * 更新通知设置
   */
  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<void> {
    if (!this.settingsCache) {
      this.settingsCache = { notification: DEFAULT_NOTIFICATION };
    }
    this.settingsCache.notification = {
      ...this.settingsCache.notification,
      ...settings,
    };
    await this.saveSettings();
  }

  /**
   * 清除所有数据
   */
  async clearAll(): Promise<void> {
    this.recordsCache.clear();
    this.settingsCache = null;
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  }
}

// 导出单例
export const storageService = new StorageService();
export default storageService;
