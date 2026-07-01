'use client';

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, isGuestMode } = useAuth();

  // 所有 hooks 必须在 early return 之前调用（React Hooks 规则）
  const handleLogin = useCallback(async () => {
    if (!email.trim()) {
      Alert.alert('提示', '请输入邮箱');
      return;
    }
    if (!password.trim()) {
      Alert.alert('提示', '请输入密码');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn(email.trim(), password);
      if (!result.success) {
        Alert.alert('登录失败', result.error || '请检查邮箱和密码');
      } else {
        Alert.alert('成功', '登录成功');
      }
    } catch (err: any) {
      Alert.alert('登录失败', err.message || '请检查网络连接');
    } finally {
      setIsLoading(false);
    }
  }, [email, password, signIn]);

  const handleRegister = useCallback(async () => {
    if (!email.trim()) {
      Alert.alert('提示', '请输入邮箱');
      return;
    }
    if (!password.trim()) {
      Alert.alert('提示', '请输入密码');
      return;
    }
    if (password.length < 6) {
      Alert.alert('提示', '密码至少6位');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('提示', '两次密码不一致');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signUp(email.trim(), password);
      if (!result.success) {
        Alert.alert('注册失败', result.error || '请稍后重试');
      } else {
        Alert.alert('注册成功', '请查收验证邮件，然后登录');
        setIsLogin(true);
      }
    } catch (err: any) {
      Alert.alert('注册失败', err.message || '请稍后重试');
    } finally {
      setIsLoading(false);
    }
  }, [email, password, confirmPassword, signUp]);

  // 游客模式下显示提示信息 — early return 在所有 hooks 之后
  if (isGuestMode) {
    return (
      <Screen style={styles.container}>
        <View style={styles.guestContainer}>
          <Text style={styles.guestEmoji}>😊</Text>
          <Text style={styles.guestTitle}>今日微笑</Text>
          <Text style={styles.guestSubtitle}>离线模式 · 无需登录</Text>
          <Text style={styles.guestDesc}>
            当前为本地预览环境，您的打卡记录将保存在设备本地。{'\n'}
            配置 Supabase 后可启用云同步功能。
          </Text>
          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => {
              // 路由守卫会自动跳转
              if (typeof window !== 'undefined') {
                window.location.href = '/';
              }
            }}
          >
            <Text style={styles.guestButtonText}>开始使用</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.logo}>今日微笑</Text>
            <Text style={styles.subtitle}>
              {isLogin ? '欢迎回来，继续记录微笑' : '创建账号，开始记录微笑'}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>邮箱</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入邮箱"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>密码</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="请输入密码"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.showPassword}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.showPasswordText}>
                    {showPassword ? '隐藏' : '显示'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>确认密码</Text>
                <TextInput
                  style={styles.input}
                  placeholder="请再次输入密码"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={isLogin ? handleLogin : handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isLogin ? '登录' : '注册'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsLogin(!isLogin)}
            >
              <Text style={styles.switchText}>
                {isLogin ? '还没有账号？立即注册' : '已有账号？立即登录'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            登录即表示同意{' '}
            <Text style={styles.link}>用户协议</Text> 和{' '}
            <Text style={styles.link}>隐私政策</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9E6',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFB800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  showPassword: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  showPasswordText: {
    color: '#FFB800',
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#FFB800',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#FFB800',
    fontSize: 14,
  },
  footer: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 12,
    color: '#999',
  },
  link: {
    color: '#FFB800',
  },
  // 游客模式样式
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  guestEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  guestTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFB800',
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 16,
    color: '#22C55E',
    fontWeight: '600',
    marginBottom: 20,
  },
  guestDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  guestButton: {
    backgroundColor: '#FFB800',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 16,
  },
  guestButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
