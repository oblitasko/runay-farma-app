import { router } from 'expo-router';

export function useAuthNavigation() {
  return {
    goToApp: () => router.replace('/(app)/venta'),
    goToLogin: () => router.replace('/(auth)/login'),
  };
}
