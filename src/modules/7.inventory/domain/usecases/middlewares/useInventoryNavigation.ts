import { router } from 'expo-router';

export function useInventoryNavigation() {
  return {
    goToInventory: (filter?: 'all' | 'min' | 'expiry') =>
      router.push(
        (filter && filter !== 'all' ? `/(app)/inventario?filter=${filter}` : '/(app)/inventario') as never,
      ),
    goToLots: (productId: string) => router.push(`/(app)/inventario/${productId}` as never),
    goToExpirations: () => router.push('/(app)/vencimientos' as never),
  };
}
