import { SettingsApiAdapter } from '../adapters';
import type { PaymentMethod } from '@/src/modules/2.sales/domain/entities';
import type { DocumentSeries, DocumentSeriesInput, Organization, OrganizationInput } from '../domain/entities';

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

const orgColumns = 'id, name, ruc, tax_address, phone, email';
const seriesColumns = 'id, store_id, type, series, next_number';

export const SettingsPort = {
  async getOrganization(organizationId: string): Promise<Organization> {
    const { data, error } = await SettingsApiAdapter.from('organizations')
      .select(orgColumns)
      .eq('id', organizationId)
      .single();
    throwIfError(error);
    return data as Organization;
  },

  async updateOrganization(organizationId: string, input: OrganizationInput): Promise<Organization> {
    const ruc = input.ruc?.trim() || null;
    if (ruc && !/^\d{11}$/.test(ruc)) {
      throw new Error('El RUC debe tener 11 dígitos');
    }
    const { data, error } = await SettingsApiAdapter.from('organizations')
      .update({
        name: input.name.trim(),
        ruc,
        tax_address: input.tax_address?.trim() || null,
        phone: input.phone?.trim() || null,
        email: input.email?.trim() || null,
      })
      .eq('id', organizationId)
      .select(orgColumns)
      .single();
    throwIfError(error);
    return data as Organization;
  },

  async listPaymentMethods(organizationId: string): Promise<PaymentMethod[]> {
    const { data, error } = await SettingsApiAdapter.from('payment_methods')
      .select('id, code, name, is_active, sort_order')
      .eq('organization_id', organizationId)
      .order('sort_order');
    throwIfError(error);
    return (data ?? []) as PaymentMethod[];
  },

  async updatePaymentMethod(id: string, input: { name?: string; is_active?: boolean }): Promise<PaymentMethod> {
    const patch: { name?: string; is_active?: boolean } = {};
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.is_active !== undefined) patch.is_active = input.is_active;
    const { data, error } = await SettingsApiAdapter.from('payment_methods')
      .update(patch)
      .eq('id', id)
      .select('id, code, name, is_active, sort_order')
      .single();
    throwIfError(error);
    return data as PaymentMethod;
  },

  async listSeries(storeId: string): Promise<DocumentSeries[]> {
    const { data, error } = await SettingsApiAdapter.from('document_series')
      .select(seriesColumns)
      .eq('store_id', storeId)
      .order('type');
    throwIfError(error);
    return (data ?? []) as DocumentSeries[];
  },

  async updateSeries(id: string, input: DocumentSeriesInput): Promise<DocumentSeries> {
    const series = input.series.trim().toUpperCase();
    if (!/^[BF][0-9]{3}$/.test(series)) {
      throw new Error('La serie debe ser B001 o F001 (letra + 3 dígitos)');
    }
    if (!Number.isInteger(input.next_number) || input.next_number < 1) {
      throw new Error('El correlativo debe ser un entero mayor o igual a 1');
    }
    const { data, error } = await SettingsApiAdapter.from('document_series')
      .update({ series, next_number: input.next_number })
      .eq('id', id)
      .select(seriesColumns)
      .single();
    throwIfError(error);
    return data as DocumentSeries;
  },
};
