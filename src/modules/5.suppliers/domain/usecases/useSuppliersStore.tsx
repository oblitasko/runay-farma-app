import { create } from 'zustand';
import type { LoadingStatusProps } from '@/src/modules/_shared/domain/entities';
import { SuppliersPort } from '../../ports';
import type { Supplier, SupplierInput } from '../entities';

type SuppliersState = {
  items: Supplier[];
  search: string;
  loading: LoadingStatusProps;
  error: string | null;
  setSearch: (search: string) => void;
  onLoad: (organizationId: string, search?: string) => Promise<void>;
  onCreate: (input: SupplierInput) => Promise<Supplier>;
  onUpdate: (id: string, input: Partial<SupplierInput>) => Promise<Supplier>;
};

export const useSuppliersStore = create<SuppliersState>((set, get) => ({
  items: [],
  search: '',
  loading: { status: 'neutral' },
  error: null,

  setSearch: (search) => set({ search }),

  onLoad: async (organizationId, search = get().search) => {
    set({ loading: { status: 'loading' }, error: null });
    try {
      const items = await SuppliersPort.list(organizationId, search);
      set({ items, loading: { status: 'success' } });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudieron cargar los proveedores',
        loading: { status: 'failed' },
      });
    }
  },

  onCreate: async (input) => {
    const supplier = await SuppliersPort.create(input);
    set({ items: [...get().items, supplier].sort((a, b) => a.name.localeCompare(b.name, 'es')) });
    return supplier;
  },

  onUpdate: async (id, input) => {
    const supplier = await SuppliersPort.update(id, input);
    set({ items: get().items.map((item) => (item.id === id ? supplier : item)) });
    return supplier;
  },
}));
