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

export type ProductTotal = {
  productId: string;
  name: string;
  quantity: number;
  total: number;
};

export type StoreTotal = {
  storeId: string;
  storeName: string;
  salesCount: number;
  total: number;
};

export type PeriodReport = {
  fromISO: string;
  toISO: string;
  days: number;
  salesCount: number;
  total: number;
  averageTicket: number;
  byMethod: MethodTotal[];
  topProducts: ProductTotal[];
  byStore: StoreTotal[];
};
