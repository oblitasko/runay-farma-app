import { router } from 'expo-router';

export function useInvoicingNavigation() {
  return {
    goToInvoice: (saleId: string) => router.push(`/(app)/factura/${saleId}` as never),
  };
}
