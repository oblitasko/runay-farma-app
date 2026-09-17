import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/src/modules/0.auth/domain/usecases';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const session = useAuthStore((state) => state.session);
  const loading = useAuthStore((state) => state.loading);
  const onInit = useAuthStore((state) => state.onInit);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    void onInit();
  }, [onInit]);

  useEffect(() => {
    if (loading.status === 'loading') return;
    SplashScreen.hideAsync().catch(() => undefined);
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(app)/venta');
    }
  }, [session, loading.status, segments, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
