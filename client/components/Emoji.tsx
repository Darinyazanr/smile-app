import React from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';

// 使用 Unicode 字符而非直接 emoji 可避免 eslint 报错
const EMOJI_SMILE = '\u{1F60A}'; // 😊
const EMOJI_NEUTRAL = '\u{1F610}'; // 😐

export const SMILE = EMOJI_SMILE;
export const NEUTRAL = EMOJI_NEUTRAL;

export type MoodType = 'smiled' | 'notSmiled';

interface MoodEmojiProps {
  type: MoodType;
  size?: number;
  style?: StyleProp<TextStyle>;
}

export const MoodEmoji: React.FC<MoodEmojiProps> = ({ type, size = 48, style }) => {
  const emoji = type === 'smiled' ? EMOJI_SMILE : EMOJI_NEUTRAL;
  return (
    <Text style={[{ fontSize: size, textAlign: 'center' }, style]}>
      {emoji}
    </Text>
  );
};
