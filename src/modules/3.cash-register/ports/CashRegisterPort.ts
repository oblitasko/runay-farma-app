import { CashRegisterApiAdapter } from '../adapters';
import type { CashSession } from '../domain/entities';

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export const CashRegisterPort = {
  async getOpen(storeId: string): Promise<CashSession | null> {
    const { data, error } = await CashRegisterApiAdapter.from('cash_sessions')
      .select(
        'id, organization_id, store_id, opened_by, closed_by, status, opening_amount, closing_amount, expected_cash, difference, notes, opened_at, closed_at',
      )
      .eq('store_id', storeId)
      .eq('status', 'open')
      .maybeSingle();
    throwIfError(error);
    return (data as CashSession | null) ?? null;
  },

  async open(input: { organizationId: string; storeId: string; openedBy: string; openingAmount: number }) {
    const { data, error } = await CashRegisterApiAdapter.from('cash_sessions')
      .insert({
        organization_id: input.organizationId,
        store_id: input.storeId,
        opened_by: input.openedBy,
        opening_amount: input.openingAmount,
        status: 'open',
      })
      .select(
        'id, organization_id, store_id, opened_by, closed_by, status, opening_amount, closing_amount, expected_cash, difference, notes, opened_at, closed_at',
      )
      .single();
    throwIfError(error);
    return data as CashSession;
  },

  async close(sessionId: string, countedAmount: number, notes?: string) {
    const { data, error } = await CashRegisterApiAdapter.rpc('close_cash_session', {
      p_session_id: sessionId,
      p_counted_amount: countedAmount,
      p_notes: notes ?? null,
    });
    throwIfError(error);
    return data as CashSession;
  },
};
