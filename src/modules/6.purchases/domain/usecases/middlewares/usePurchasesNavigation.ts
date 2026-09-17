import { router } from 'expo-router';

export function usePurchasesNavigation() {
  return {
    goToPurchases: () => router.replace('/(app)/compras' as never),
    goToReceive: () => router.push('/(app)/compras/nueva' as never),
    goToSuppliers: () => router.push('/(app)/proveedores' as never),
    goToRestock: () => router.push('/(app)/reposicion' as never),
    goToStores: () => router.push('/(app)/sucursales' as never),
  };
}
