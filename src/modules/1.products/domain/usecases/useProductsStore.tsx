import { create } from 'zustand';
import type { LoadingStatusProps } from '@/src/modules/_shared/domain/entities';
import { ProductsPort } from '../../ports';
import type { Product, ProductInput } from '../entities';

type ProductsState = {
  items: Product[];
  search: string;
  loading: LoadingStatusProps;
  error: string | null;
  setSearch: (search: string) => void;
  onLoad: (organizationId: string, search?: string) => Promise<void>;
  onCreate: (input: ProductInput) => Promise<Product>;
  onUpdate: (id: string, input: Partial<ProductInput>) => Promise<Product>;
};

export const useProductsStore = create<ProductsState>((set, get) => ({
  items: [],
  search: '',
  loading: { status: 'neutral' },
  error: null,

  setSearch: (search) => set({ search }),

  onLoad: async (organizationId, search = get().search) => {
    set({ loading: { status: 'loading' }, error: null });
    try {
      const items = await ProductsPort.list(organizationId, search);
      set({ items, loading: { status: 'success' } });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudieron cargar los productos',
        loading: { status: 'failed' },
      });
    }
  },

  onCreate: async (input) => {
    const product = await ProductsPort.create(input);
    set({ items: [...get().items, product].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, 'es')) });
    return product;
  },

  onUpdate: async (id, input) => {
    const product = await ProductsPort.update(id, input);
    set({ items: get().items.map((item) => (item.id === id ? product : item)) });
    return product;
  },
}));
