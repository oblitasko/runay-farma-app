import { roundMoney } from '@/src/modules/_shared/utils';
import { SalesPort } from '@/src/modules/2.sales/ports';
import { paymentMethodInfo } from '@/src/modules/2.sales/domain/entities';
import type { DailyReport, MethodTotal } from '../domain/entities';

export const ReportsPort = {
  async getDaily(storeId: string, dateISO: string): Promise<DailyReport> {
    const sales = await SalesPort.listSales(storeId, dateISO);
    const completed = sales.filter((sale) => sale.status === 'completed');
    const totals = new Map<string, MethodTotal>();

    for (const sale of completed) {
      for (const payment of sale.sale_payments ?? []) {
        const method = paymentMethodInfo(payment);
        const code = method.code;
        const name = method.name;
        const current = totals.get(code) ?? { code, name, amount: 0 };
        current.amount = roundMoney(current.amount + Number(payment.amount));
        totals.set(code, current);
      }
    }

    const byMethod = [...totals.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
    const cashTotal = byMethod.find((item) => item.code === 'cash')?.amount ?? 0;

    return {
      dateISO,
      salesCount: completed.length,
      total: roundMoney(completed.reduce((sum, sale) => sum + Number(sale.total), 0)),
      byMethod,
      cashTotal,
    };
  },
};
