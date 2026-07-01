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
    const applyConfig = (cfg: SupabaseConfig) => {
      setConfig(cfg);
      (globalThis as unknown as { __SUPABASE_CONFIG__: SupabaseConfig }).__SUPABASE_CONFIG__ = cfg;
      globalThis.dispatchEvent(new CustomEvent(SUPABASE_CONFIG_READY_EVENT, { detail: cfg }));
    };

    // 优先使用编译时注入的环境变量（Web 静态导出 / 开发环境）
    const envUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const envKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (envUrl && envKey) {
      applyConfig({ url: envUrl, anonKey: envKey });
      setIsLoading(false);
      return;
    }

    // 环境变量不存在时，尝试从后端 API 获取（生产部署场景）
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';
    fetch(`${backendUrl}/api/v1/supabase-config`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.url && data.anonKey) {
          applyConfig(data);
        } else {
          throw new Error('Invalid config response');
        }
      })
      .catch((err) => {
        setError(err.message);
        console.error('Failed to load Supabase config:', err);
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
