export type MethodTotal = {
  code: string;
  name: string;
  amount: number;
};

export type DailyReport = {
  dateISO: string;
  salesCount: number;
  total: number;
  byMethod: MethodTotal[];
  cashTotal: number;
};
