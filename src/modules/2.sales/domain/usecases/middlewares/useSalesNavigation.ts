import { router } from 'expo-router';

export function useSalesNavigation() {
  return {
    goToCheckout: () => router.push('/(app)/venta/checkout'),
    goToSuccess: (id: string) => router.replace(`/(app)/venta/exito?id=${id}`),
    goToSale: () => router.replace('/(app)/venta'),
    goToDetail: (id: string) => router.push(`/(app)/historial/${id}`),
  };
}
