import { limaDayRange } from '@/src/modules/_shared/utils';
import { SalesApiAdapter } from '../adapters';
import type { CreateSaleInput, PaymentMethod, Sale } from '../domain/entities';

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

const saleSelect = `
  id, store_id, cash_session_id, cashier_id, status, subtotal, total, created_at,
  sale_items (id, product_id, product_name, quantity, unit_price, subtotal),
  sale_payments (id, payment_method_id, amount, payment_methods (code, name))
`;

export const SalesPort = {
  async listPaymentMethods(organizationId: string): Promise<PaymentMethod[]> {
    const { data, error } = await SalesApiAdapter.from('payment_methods')
      .select('id, code, name, is_active, sort_order')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('sort_order');
    throwIfError(error);
    return (data ?? []) as PaymentMethod[];
  },

  async createSale(input: CreateSaleInput): Promise<string> {
    const { data, error } = await SalesApiAdapter.rpc('create_sale', {
      p_store_id: input.storeId,
      p_cash_session_id: input.cashSessionId,
      p_items: input.items,
      p_payments: input.payments,
    });
    throwIfError(error);
    return data as string;
  },

  async listSales(storeId: string, dateISO: string): Promise<Sale[]> {
    const { from, to } = limaDayRange(dateISO);
    const { data, error } = await SalesApiAdapter.from('sales')
      .select(saleSelect)
      .eq('store_id', storeId)
      .gte('created_at', from)
      .lte('created_at', to)
      .order('created_at', { ascending: false });
    throwIfError(error);
    return (data ?? []) as unknown as Sale[];
  },

  async getSale(id: string): Promise<Sale> {
    const { data, error } = await SalesApiAdapter.from('sales').select(saleSelect).eq('id', id).single();
    throwIfError(error);
    return data as unknown as Sale;
  },
};
