import { AuthProvider } from '@/contexts/AuthContext';
import { type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WebOnlyColorSchemeUpdater } from './ColorSchemeUpdater';
import { WebOnlyPrettyScrollbar } from './PrettyScrollbar'
import { HeroUINativeProvider } from '@/heroui';
import { SmileProvider } from '@/contexts/SmileContext';
import { SupabaseConfigProvider } from '@/lib/supabase-config-inject';

function Provider({ children }: { children: ReactNode }) {
  return <WebOnlyColorSchemeUpdater>
    <WebOnlyPrettyScrollbar>
      <SupabaseConfigProvider>
        <AuthProvider>
          <SmileProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <HeroUINativeProvider>
                {children}
              </HeroUINativeProvider>
            </GestureHandlerRootView>
          </SmileProvider>
        </AuthProvider>
      </SupabaseConfigProvider>
    </WebOnlyPrettyScrollbar>
  </WebOnlyColorSchemeUpdater>
}

export {
  Provider,
}
