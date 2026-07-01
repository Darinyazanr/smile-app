/**
 * LoadingScreen - 加载态/骨架屏组件
 */
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { SMILE } from '@/components/Emoji';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = '加载中...' }: LoadingScreenProps) {
  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.emoji}>{SMILE}</Text>
        <ActivityIndicator size="large" color="#F59E0B" style={styles.spinner} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
});
