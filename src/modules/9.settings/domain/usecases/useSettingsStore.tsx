import { create } from 'zustand';
import type { LoadingStatusProps } from '@/src/modules/_shared/domain/entities';
import type { PaymentMethod } from '@/src/modules/2.sales/domain/entities';
import { SettingsPort } from '../../ports';
import type { DocumentSeries, Organization } from '../entities';

type SettingsState = {
  organization: Organization | null;
  methods: PaymentMethod[];
  series: DocumentSeries[];
  loading: LoadingStatusProps;
  error: string | null;
  onLoad: (organizationId: string, storeId: string | null) => Promise<void>;
  onSaveOrganization: (organizationId: string, input: Parameters<typeof SettingsPort.updateOrganization>[1]) => Promise<void>;
  onSaveMethod: (id: string, input: { name?: string; is_active?: boolean }) => Promise<void>;
  onSaveSeries: (id: string, input: { series: string; next_number: number }) => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  organization: null,
  methods: [],
  series: [],
  loading: { status: 'neutral' },
  error: null,

  onLoad: async (organizationId, storeId) => {
    set({ loading: { status: 'loading' }, error: null });
    try {
      const [organization, methods, series] = await Promise.all([
        SettingsPort.getOrganization(organizationId),
        SettingsPort.listPaymentMethods(organizationId),
        storeId ? SettingsPort.listSeries(storeId) : Promise.resolve([]),
      ]);
      set({ organization, methods, series, loading: { status: 'success' } });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudo cargar la configuración',
        loading: { status: 'failed' },
      });
    }
  },

  onSaveOrganization: async (organizationId, input) => {
    const organization = await SettingsPort.updateOrganization(organizationId, input);
    set({ organization });
  },

  onSaveMethod: async (id, input) => {
    const method = await SettingsPort.updatePaymentMethod(id, input);
    set({ methods: get().methods.map((item) => (item.id === id ? method : item)) });
  },

  onSaveSeries: async (id, input) => {
    const row = await SettingsPort.updateSeries(id, input);
    set({ series: get().series.map((item) => (item.id === id ? row : item)) });
  },
}));
