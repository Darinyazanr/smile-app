'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

interface SupabaseConfigContextType {
  config: SupabaseConfig | null;
  isLoading: boolean;
  error: string | null;
}

const SupabaseConfigContext = createContext<SupabaseConfigContextType>({
  config: null,
  isLoading: true,
  error: null,
});

export const SUPABASE_CONFIG_READY_EVENT = 'supabase-config-ready';

export function useSupabaseConfig() {
  return useContext(SupabaseConfigContext);
}

interface SupabaseConfigProviderProps {
  children: ReactNode;
}

export function SupabaseConfigProvider({ children }: SupabaseConfigProviderProps) {
  const [config, setConfig] = useState<SupabaseConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 从后端 API 获取配置（使用相对路径，通过 nginx 代理）
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';
    fetch(`${backendUrl}/api/v1/supabase-config`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.url && data.anonKey) {
          setConfig(data);
          (globalThis as unknown as { __SUPABASE_CONFIG__: SupabaseConfig }).__SUPABASE_CONFIG__ = data;
          globalThis.dispatchEvent(new CustomEvent(SUPABASE_CONFIG_READY_EVENT, { detail: data }));
        } else {
          throw new Error('Invalid config response');
        }
      })
      .catch((err) => {
        // 如果 API 获取失败，尝试从环境变量获取（开发环境）
        const envUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        const envKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
        
        if (envUrl && envKey) {
          const envConfig = { url: envUrl, anonKey: envKey };
          setConfig(envConfig);
          (globalThis as unknown as { __SUPABASE_CONFIG__: SupabaseConfig }).__SUPABASE_CONFIG__ = envConfig;
          globalThis.dispatchEvent(new CustomEvent(SUPABASE_CONFIG_READY_EVENT, { detail: envConfig }));
        } else {
          setError(err.message);
          console.error('Failed to load Supabase config:', err);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <SupabaseConfigContext.Provider value={{ config, isLoading, error }}>
      {children}
    </SupabaseConfigContext.Provider>
  );
}
