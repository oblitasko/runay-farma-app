import { Redirect } from 'expo-router';
import { useAuthStore } from '@/src/modules/0.auth/domain/usecases';

export default function Index() {
  const session = useAuthStore((state) => state.session);
  const loading = useAuthStore((state) => state.loading);

  if (loading.status === 'loading') return null;
  return <Redirect href={session ? '/(app)/venta' : '/(auth)/login'} />;
}
