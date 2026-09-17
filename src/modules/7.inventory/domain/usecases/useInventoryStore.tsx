import { create } from 'zustand';
import type { LoadingStatusProps } from '@/src/modules/_shared/domain/entities';
import { InventoryPort } from '../../ports';
import type { KardexLine, KardexPeriod, Lot, RestockSuggestion, StockRow } from '../entities';

type Filter = 'all' | 'min' | 'expiry';

type InventoryState = {
  stock: StockRow[];
  lots: Lot[];
  restock: RestockSuggestion[];
  kardex: KardexLine[];
  kardexPeriod: KardexPeriod;
  kardexLot: string | null;
  filter: Filter;
  alertCount: number;
  loading: LoadingStatusProps;
  error: string | null;
  setFilter: (filter: Filter) => void;
  setKardexPeriod: (period: KardexPeriod) => void;
  setKardexLot: (lotCode: string | null) => void;
  onLoadStock: (organizationId: string, storeId: string) => Promise<void>;
  onLoadLots: (storeId: string, productId?: string) => Promise<void>;
  onLoadRestock: (organizationId: string, storeId: string) => Promise<void>;
  onLoadKardex: (storeId: string, productId: string) => Promise<void>;
};

export const useInventoryStore = create<InventoryState>((set) => ({
  stock: [],
  lots: [],
  restock: [],
  kardex: [],
  kardexPeriod: 365,
  kardexLot: null,
  filter: 'all',
  alertCount: 0,
  loading: { status: 'neutral' },
  error: null,

  setFilter: (filter) => set({ filter }),
  setKardexPeriod: (kardexPeriod) => set({ kardexPeriod }),
  setKardexLot: (kardexLot) => set({ kardexLot }),

  onLoadStock: async (organizationId, storeId) => {
    set({ loading: { status: 'loading' }, error: null });
    try {
      const stock = await InventoryPort.listStock(organizationId, storeId);
      set({ stock, alertCount: InventoryPort.alertCount(stock), loading: { status: 'success' } });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudo cargar el inventario',
        loading: { status: 'failed' },
      });
    }
  },

  onLoadLots: async (storeId, productId) => {
    set({ loading: { status: 'loading' }, error: null });
    try {
      const lots = await InventoryPort.listLots(storeId, productId);
      set({ lots, loading: { status: 'success' } });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudieron cargar los lotes',
        loading: { status: 'failed' },
      });
    }
  },

  onLoadRestock: async (organizationId, storeId) => {
    set({ loading: { status: 'loading' }, error: null });
    try {
      const restock = await InventoryPort.suggestRestock(organizationId, storeId);
      set({ restock, loading: { status: 'success' } });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudo calcular la reposición',
        loading: { status: 'failed' },
      });
    }
  },

  onLoadKardex: async (storeId, productId) => {
    set({ loading: { status: 'loading' }, error: null, kardexLot: null });
    try {
      const kardex = await InventoryPort.listKardex(storeId, productId);
      set({ kardex, loading: { status: 'success' } });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudo cargar el kardex',
        loading: { status: 'failed' },
      });
    }
  },
}));
