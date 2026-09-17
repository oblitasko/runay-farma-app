import { create } from 'zustand';
import type { LoadingStatusProps } from '@/src/modules/_shared/domain/entities';
import { limaDateISO } from '@/src/modules/_shared/utils';
import { ReportsPort } from '../../ports';
import type { DailyReport } from '../entities';

type ReportsState = {
  report: DailyReport | null;
  dateISO: string;
  loading: LoadingStatusProps;
  error: string | null;
  setDate: (dateISO: string) => void;
  onLoad: (storeId: string, dateISO?: string) => Promise<void>;
};

export const useReportsStore = create<ReportsState>((set, get) => ({
  report: null,
  dateISO: limaDateISO(),
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
}));
