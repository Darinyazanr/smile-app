/**
 * 今日微笑 - 打卡记录数据模型
 */
export interface SmileRecord {
  id: string;
  date: string; // 格式: YYYY-MM-DD
  smiled: boolean;
  reason?: string;
  photoPath?: string;
  createdAt: number; // Unix 时间戳 (毫秒)
}

/**
 * 通知设置
 */
export interface NotificationSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

/**
 * 应用设置
 */
export interface AppSettings {
  notification: NotificationSettings;
}
