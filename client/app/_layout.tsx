// Polyfill: React Native 缺少 DOM Event API，
// @supabase/supabase-js 和 supabase-config-inject 都需要它们
if (typeof globalThis.Event === 'undefined') {
  class Event {
    type: string;
    constructor(type: string) {
      this.type = type;
    }
  }
  globalThis.Event = Event as any;
}
if (typeof globalThis.CustomEvent === 'undefined') {
  class CustomEvent extends (globalThis.Event as any) {
    detail: any;
    constructor(type: string, options?: CustomEventInit) {
      super(type);
      this.detail = options?.detail;
    }
  }
  globalThis.CustomEvent = CustomEvent as any;
}
if (typeof globalThis.addEventListener === 'undefined') {
  const listeners = new Map<string, Set<Function>>();
  (globalThis as any).addEventListener = function (type: string, listener: Function) {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type)!.add(listener);
  };
  (globalThis as any).removeEventListener = function (type: string, listener: Function) {
    listeners.get(type)?.delete(listener);
  };
  (globalThis as any).dispatchEvent = function (event: Event) {
    listeners.get(event.type)?.forEach((fn) => fn(event));
    return true;
  };
}

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { Provider } from '@/components/Provider';

import '../global.css';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
  // 添加其它想暂时忽略的错误或警告信息
]);

export default function RootLayout() {
  return (
    <Provider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          headerShown: false
        }}
      >
        <Stack.Screen name="auth/index" options={{ title: "" }} />
        <Stack.Screen name="index" options={{ title: "" }} />
        <Stack.Screen name="calendar" options={{ title: "" }} />
        <Stack.Screen name="stats" options={{ title: "" }} />
        <Stack.Screen name="settings" options={{ title: "" }} />
      </Stack>
    </Provider>
  );
}
