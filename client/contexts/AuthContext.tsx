/**
 * AuthContext - 认证状态管理
 *
 * 三种模式：
 * 1. 正常模式：Supabase 可用，完整登录/注册流程
 * 2. 游客模式：Supabase 不可用（开发/预览环境），自动以游客身份进入首页
 * 3. 加载中：等待 Supabase 配置
 */
import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter as useExpoRouter, useSegments } from 'expo-router';
import { getSupabaseBrowserClientWithRetry } from '@/lib/supabase-browser';

interface User {
  id: string;
  email?: string;
  phone?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** 是否为游客模式（Supabase 不可用时的降级） */
  isGuestMode: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isGuestMode: false,
  signIn: async () => ({ success: false }),
  signUp: async () => ({ success: false }),
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [supabaseAvailable, setSupabaseAvailable] = useState<boolean | null>(null);
  const segments = useSegments();
  
  const { push: routerPush, replace: routerReplace } = useExpoRouter() as any;

  // 初始化：检测 Supabase 是否可用
  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      try {
        const supabase = await getSupabaseBrowserClientWithRetry(3, 2000);
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!cancelled) {
          setUser(currentUser as User | null);
          setSupabaseAvailable(true);
        }
      } catch (error) {
        console.warn('[Auth] Supabase 不可用，进入游客模式:', (error as Error).message);
        if (!cancelled) {
          setSupabaseAvailable(false);
          setIsGuestMode(true);
          // 创建游客用户
          setUser({
            id: 'guest_' + Date.now(),
            email: '游客',
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // 仅当 Supabase 可用时才监听状态变化
    let unsubscribe: (() => void) | undefined;
    const initListener = async () => {
      try {
        const supabase = await getSupabaseBrowserClientWithRetry(3, 2000);
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            if (!cancelled) {
              setUser(session?.user as User | null);
            }
          }
        );
        unsubscribe = () => subscription.unsubscribe();
      } catch {
        // Supabase 不可用，无需监听
      }
    };
    initListener();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  // 路由守卫
  useEffect(() => {
    if (isLoading || supabaseAvailable === null) return;

    const inAuthRoute = segments[0] === 'auth';
    
    if (isGuestMode) {
      // 游客模式：如果在登录页，自动跳转到首页
      if (inAuthRoute) {
        routerReplace('/');
      }
      return;
    }

    // 正常模式路由守卫
    if (!user && !inAuthRoute) {
      routerReplace('/auth');
    } else if (user && inAuthRoute) {
      routerReplace('/');
    }
  }, [user, isLoading, segments, routerReplace, isGuestMode, supabaseAvailable]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (isGuestMode) {
      return { success: false, error: '当前为离线模式，无需登录即可使用。' };
    }

    try {
      const supabase = await getSupabaseBrowserClientWithRetry();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      setUser(data.user as User);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || '登录服务暂不可用' };
    }
  }, [isGuestMode]);

  const signUp = useCallback(async (email: string, password: string) => {
    if (isGuestMode) {
      return { success: false, error: '当前为离线模式，无需注册即可使用。' };
    }

    try {
      const supabase = await getSupabaseBrowserClientWithRetry();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || '注册服务暂不可用' };
    }
  }, [isGuestMode]);

  const signOut = useCallback(async () => {
    if (isGuestMode) {
      // 游客模式不需要登出
      return;
    }

    try {
      const supabase = await getSupabaseBrowserClientWithRetry();
      await supabase.auth.signOut();
      setUser(null);
      routerReplace('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [routerReplace, isGuestMode]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isGuestMode,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
