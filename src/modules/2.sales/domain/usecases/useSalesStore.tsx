import { create } from 'zustand';
import type { LoadingStatusProps } from '@/src/modules/_shared/domain/entities';
import { limaDateISO, roundMoney } from '@/src/modules/_shared/utils';
import type { Product } from '@/src/modules/1.products/domain/entities';
import { SalesPort } from '../../ports';
import type { CartItem, PaymentMethod, Sale, SalePaymentInput } from '../entities';

type SalesState = {
  cart: CartItem[];
  methods: PaymentMethod[];
  history: Sale[];
  selectedSale: Sale | null;
  lastSaleId: string | null;
  loading: LoadingStatusProps;
  error: string | null;
  addToCart: (product: Product) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotal: () => number;
  onLoadMethods: (organizationId: string) => Promise<void>;
  onCheckout: (storeId: string, cashSessionId: string, payments: SalePaymentInput[]) => Promise<string>;
  onLoadHistory: (storeId: string, dateISO?: string) => Promise<void>;
  onLoadSale: (id: string) => Promise<void>;
};

export const useSalesStore = create<SalesState>((set, get) => ({
  cart: [],
  methods: [],
  history: [],
  selectedSale: null,
  lastSaleId: null,
  loading: { status: 'neutral' },
  error: null,

  addToCart: (product) => {
    const current = get().cart;
    const existing = current.find((item) => item.productId === product.id);
    if (existing) {
      set({
        cart: current.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        ),
      });
      return;
    }
    set({
      cart: [
        ...current,
        {
          productId: product.id,
          name: product.name,
          unitPrice: Number(product.sale_price),
          quantity: 1,
        },
      ],
    });
  },

  setQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      set({ cart: get().cart.filter((item) => item.productId !== productId) });
      return;
    }
    set({
      cart: get().cart.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
    });
  },

  removeFromCart: (productId) => {
    set({ cart: get().cart.filter((item) => item.productId !== productId) });
  },

  clearCart: () => set({ cart: [] }),

  cartTotal: () => roundMoney(get().cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)),

  onLoadMethods: async (organizationId) => {
    const methods = await SalesPort.listPaymentMethods(organizationId);
    set({ methods });
  },

  onCheckout: async (storeId, cashSessionId, payments) => {
    set({ loading: { status: 'loading' }, error: null });
    try {
      const saleId = await SalesPort.createSale({
        storeId,
        cashSessionId,
        items: get().cart.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
        payments,
      });
      set({ lastSaleId: saleId, cart: [], loading: { status: 'success' } });
      return saleId;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudo registrar la venta',
        loading: { status: 'failed' },
      });
      throw error;
    }
  },

  onLoadHistory: async (storeId, dateISO = limaDateISO()) => {
    set({ loading: { status: 'loading' }, error: null });
    try {
      const history = await SalesPort.listSales(storeId, dateISO);
      set({ history, loading: { status: 'success' } });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudo cargar el historial',
        loading: { status: 'failed' },
      });
    }
  },

  onLoadSale: async (id) => {
    const selectedSale = await SalesPort.getSale(id);
    set({ selectedSale });
  },
}));
