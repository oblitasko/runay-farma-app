export type CashSessionStatus = 'open' | 'closed';

export type CashSession = {
  id: string;
  organization_id: string;
  store_id: string;
  opened_by: string;
  closed_by: string | null;
  status: CashSessionStatus;
  opening_amount: number;
  closing_amount: number | null;
  expected_cash: number | null;
  difference: number | null;
  notes: string | null;
  opened_at: string;
  closed_at: string | null;
};
