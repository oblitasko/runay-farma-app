import { roundMoney } from '@/src/modules/_shared/utils';
import type { Sale } from '@/src/modules/2.sales/domain/entities';
import { paymentMethodInfo } from '@/src/modules/2.sales/domain/entities';
import { SalesPort } from '@/src/modules/2.sales/ports';
import type { DailyReport, MethodTotal, PeriodReport, ProductTotal, StoreTotal } from '../domain/entities';

function totalsFromSales(sales: Sale[]) {
  const completed = sales.filter((sale) => sale.status === 'completed');
  const methodMap = new Map<string, MethodTotal>();
  const productMap = new Map<string, ProductTotal>();

  for (const sale of completed) {
    for (const payment of sale.sale_payments ?? []) {
      const method = paymentMethodInfo(payment);
      const current = methodMap.get(method.code) ?? { code: method.code, name: method.name, amount: 0 };
      current.amount = roundMoney(current.amount + Number(payment.amount));
      methodMap.set(method.code, current);
    }
    for (const item of sale.sale_items ?? []) {
      const current = productMap.get(item.product_id) ?? {
        productId: item.product_id,
        name: item.product_name,
        quantity: 0,
        total: 0,
      };
      current.quantity += Number(item.quantity);
      current.total = roundMoney(current.total + Number(item.subtotal));
      productMap.set(item.product_id, current);
    }
  }

  const total = roundMoney(completed.reduce((sum, sale) => sum + Number(sale.total), 0));
  return {
    completed,
    total,
    byMethod: [...methodMap.values()].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    topProducts: [...productMap.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 8),
  };
}

export const ReportsPort = {
  async getDaily(storeId: string, dateISO: string): Promise<DailyReport> {
    const sales = await SalesPort.listSales(storeId, dateISO);
    const { completed, total, byMethod } = totalsFromSales(sales);
    const cashTotal = byMethod.find((item) => item.code === 'cash')?.amount ?? 0;
    return {
      dateISO,
      salesCount: completed.length,
      total,
      byMethod,
      cashTotal,
    };
  },

  async getPeriod(
    storeId: string,
    fromISO: string,
    toISO: string,
    days: number,
    stores: { id: string; name: string }[] = [],
  ): Promise<PeriodReport> {
    const sales = await SalesPort.listSalesRange(storeId, fromISO, toISO);
    const { completed, total, byMethod, topProducts } = totalsFromSales(sales);
    const byStore: StoreTotal[] = [];

    if (stores.length > 1) {
      const others = await Promise.all(
        stores.map(async (store) => {
          const storeSales = store.id === storeId ? sales : await SalesPort.listSalesRange(store.id, fromISO, toISO);
          const stats = totalsFromSales(storeSales);
          return {
            storeId: store.id,
            storeName: store.name,
            salesCount: stats.completed.length,
            total: stats.total,
          };
        }),
      );
      byStore.push(...others.sort((a, b) => b.total - a.total));
    }

    return {
      fromISO,
      toISO,
      days,
      salesCount: completed.length,
      total,
      averageTicket: completed.length ? roundMoney(total / completed.length) : 0,
      byMethod,
      topProducts,
      byStore,
    };
  },
};
