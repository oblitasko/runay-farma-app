import { create } from 'zustand';
import type { LoadingStatusProps } from '@/src/modules/_shared/domain/entities';
import { addLimaDays, limaDateISO } from '@/src/modules/_shared/utils';
import { ReportsPort } from '../../ports';
import type { DailyReport, PeriodReport } from '../entities';

type ReportsState = {
  report: DailyReport | null;
  period: PeriodReport | null;
  dateISO: string;
  periodDays: 7 | 30;
  loading: LoadingStatusProps;
  error: string | null;
  setDate: (dateISO: string) => void;
  onLoad: (storeId: string, dateISO?: string) => Promise<void>;
  onLoadPeriod: (storeId: string, days: 7 | 30, stores?: { id: string; name: string }[]) => Promise<void>;
};

export const useReportsStore = create<ReportsState>((set, get) => ({
  report: null,
  period: null,
  dateISO: limaDateISO(),
  periodDays: 7,
  loading: { status: 'neutral' },
  error: null,

  setDate: (dateISO) => set({ dateISO }),

  onLoad: async (storeId, dateISO = get().dateISO) => {
    set({ loading: { status: 'loading' }, error: null, dateISO });
    try {
      const report = await ReportsPort.getDaily(storeId, dateISO);
      set({ report, loading: { status: 'success' } });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudo cargar el reporte',
        loading: { status: 'failed' },
      });
    }
  },

  onLoadPeriod: async (storeId, days, stores = []) => {
    set({ loading: { status: 'loading' }, error: null, periodDays: days });
    try {
      const toISO = limaDateISO();
      const fromISO = addLimaDays(toISO, -(days - 1));
      const period = await ReportsPort.getPeriod(storeId, fromISO, toISO, days, stores);
      set({ period, loading: { status: 'success' } });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudieron cargar las estadísticas',
        loading: { status: 'failed' },
      });
    }
  },
}));
