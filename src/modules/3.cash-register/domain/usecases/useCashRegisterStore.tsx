import { create } from 'zustand';
import type { LoadingStatusProps } from '@/src/modules/_shared/domain/entities';
import { CashRegisterPort } from '../../ports';
import type { CashSession } from '../entities';

type CashRegisterState = {
  session: CashSession | null;
  lastClosed: CashSession | null;
  loading: LoadingStatusProps;
  error: string | null;
  onLoadOpen: (storeId: string) => Promise<void>;
  onOpen: (input: {
    organizationId: string;
    storeId: string;
    openedBy: string;
    openingAmount: number;
  }) => Promise<void>;
  onClose: (countedAmount: number, notes?: string) => Promise<void>;
};

export const useCashRegisterStore = create<CashRegisterState>((set, get) => ({
  session: null,
  lastClosed: null,
  loading: { status: 'neutral' },
  error: null,

  onLoadOpen: async (storeId) => {
    set({ loading: { status: 'loading' }, error: null });
    try {
      const session = await CashRegisterPort.getOpen(storeId);
      set({ session, loading: { status: 'success' } });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudo cargar la caja',
        loading: { status: 'failed' },
      });
    }
  },

  onOpen: async (input) => {
    set({ loading: { status: 'loading' }, error: null });
    try {
      const session = await CashRegisterPort.open(input);
      set({ session, lastClosed: null, loading: { status: 'success' } });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudo abrir la caja',
        loading: { status: 'failed' },
      });
      throw error;
    }
  },

  onClose: async (countedAmount, notes) => {
    const current = get().session;
    if (!current) throw new Error('No hay caja abierta');
    set({ loading: { status: 'loading' }, error: null });
    try {
      const lastClosed = await CashRegisterPort.close(current.id, countedAmount, notes);
      set({ session: null, lastClosed, loading: { status: 'success' } });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudo cerrar la caja',
        loading: { status: 'failed' },
      });
      throw error;
    }
  },
}));
