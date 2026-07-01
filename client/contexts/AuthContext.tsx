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
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
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
  const segments = useSegments();
  
  // 使用 useSafeRouter hook
  const { push: routerPush, replace: routerReplace } = useExpoRouter() as any;

  // 初始化检查登录状态
  useEffect(() => {
    const initAuth = async () => {
      try {
        const supabase = await getSupabaseBrowserClientWithRetry();
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user as User | null);
      } catch (error) {
        console.error('Failed to get user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // 监听登录状态变化
    const initAndListen = async () => {
      const supabase = await getSupabaseBrowserClientWithRetry();
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.email);
          setUser(session?.user as User | null);
        }
      );

      return () => subscription.unsubscribe();
    };

    initAndListen();
  }, []);

  // 路由守卫
  useEffect(() => {
    if (isLoading) return;

    const inAuthRoute = segments[0] === 'auth';
    
    if (!user && !inAuthRoute) {
      // 未登录，跳转到登录页
      routerReplace('/auth');
    } else if (user && inAuthRoute) {
      // 已登录，在登录页，跳转到首页
      routerReplace('/');
    }
  }, [user, isLoading, segments, routerReplace]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const supabase = await getSupabaseBrowserClientWithRetry();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // 手动更新状态，确保同步
      setUser(data.user as User);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const supabase = await getSupabaseBrowserClientWithRetry();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // 注册成功但需要邮箱验证，不自动登录
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const supabase = await getSupabaseBrowserClientWithRetry();
      await supabase.auth.signOut();
      setUser(null);
      routerReplace('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [routerReplace]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
