import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ButtonComponent, EmptyState, InputComponent, ScreenHeader } from '@/src/modules/_shared/components';
import { colors, fontSize, radius, space } from '@/src/modules/_shared/theme';
import { useAuthStore } from '@/src/modules/0.auth/domain/usecases';
import type { PaymentMethod } from '@/src/modules/2.sales/domain/entities';
import type { DocumentSeries } from '../../../domain/entities';
import { useSettingsStore } from '../../../domain/usecases';

type OrgForm = {
  name: string;
  ruc: string;
  tax_address: string;
  phone: string;
  email: string;
};

type StoreForm = {
  name: string;
  address: string;
  district: string;
  phone: string;
  hours: string;
  sanitary_auth: string;
  director_name: string;
  director_license: string;
};

const emptyOrg: OrgForm = { name: '', ruc: '', tax_address: '', phone: '', email: '' };
const emptyStore: StoreForm = {
  name: '',
  address: '',
  district: '',
  phone: '',
  hours: '',
  sanitary_auth: '',
  director_name: '',
  director_license: '',
};

export function SettingsScreen() {
  const profile = useAuthStore((state) => state.profile);
  const stores = useAuthStore((state) => state.stores);
  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  const onUpdateStore = useAuthStore((state) => state.onUpdateStore);
  const isOwner = profile?.role === 'owner';
  const { organization, methods, series, onLoad, onSaveOrganization, onSaveMethod, onSaveSeries, loading, error } =
    useSettingsStore();
  const [orgForm, setOrgForm] = useState<OrgForm>(emptyOrg);
  const [storeForm, setStoreForm] = useState<StoreForm>(emptyStore);
  const [seriesDraft, setSeriesDraft] = useState<Record<string, { series: string; next_number: string }>>({});
  const [methodNames, setMethodNames] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const activeStore = stores.find((store) => store.id === activeStoreId) ?? null;

  useEffect(() => {
    if (isOwner && profile?.organization_id) {
      void onLoad(profile.organization_id, activeStoreId);
    }
  }, [isOwner, profile?.organization_id, activeStoreId, onLoad]);

  useEffect(() => {
    if (!organization) return;
    setOrgForm({
      name: organization.name ?? '',
      ruc: organization.ruc ?? '',
      tax_address: organization.tax_address ?? '',
      phone: organization.phone ?? '',
      email: organization.email ?? '',
    });
  }, [organization]);

  useEffect(() => {
    if (!activeStore) return;
    setStoreForm({
      name: activeStore.name ?? '',
      address: activeStore.address ?? '',
      district: activeStore.district ?? '',
      phone: activeStore.phone ?? '',
      hours: activeStore.hours ?? '',
      sanitary_auth: activeStore.sanitary_auth ?? '',
      director_name: activeStore.director_name ?? '',
      director_license: activeStore.director_license ?? '',
    });
  }, [activeStore]);

  useEffect(() => {
    setSeriesDraft(
      Object.fromEntries(series.map((row) => [row.id, { series: row.series, next_number: String(row.next_number) }])),
    );
  }, [series]);

  useEffect(() => {
    setMethodNames(Object.fromEntries(methods.map((method) => [method.id, method.name])));
  }, [methods]);

  const saveOrg = async () => {
    if (!profile) return;
    if (!orgForm.name.trim()) {
      setFormError('La razón social es obligatoria');
      return;
    }
    if (orgForm.ruc.trim() && !/^\d{11}$/.test(orgForm.ruc.trim())) {
      setFormError('El RUC debe tener 11 dígitos');
      return;
    }
    setSaving('org');
    setFormError(null);
    try {
      await onSaveOrganization(profile.organization_id, orgForm);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el negocio');
    } finally {
      setSaving(null);
    }
  };

  const saveStore = async () => {
    if (!activeStore) return;
    if (!storeForm.name.trim()) {
      setFormError('El nombre comercial del local es obligatorio');
      return;
    }
    setSaving('store');
    setFormError(null);
    try {
      await onUpdateStore(activeStore.id, storeForm);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el local');
    } finally {
      setSaving(null);
    }
  };

  const saveMethod = async (method: PaymentMethod) => {
    setSaving(method.id);
    setFormError(null);
    try {
      await onSaveMethod(method.id, { name: methodNames[method.id] ?? method.name });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el método');
    } finally {
      setSaving(null);
    }
  };

  const toggleMethod = async (method: PaymentMethod) => {
    if (method.code === 'cash') return;
    setSaving(method.id);
    setFormError(null);
    try {
      await onSaveMethod(method.id, { is_active: !method.is_active });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo actualizar el método');
    } finally {
      setSaving(null);
    }
  };

  const saveSeriesRow = async (row: DocumentSeries) => {
    const draft = seriesDraft[row.id];
    if (!draft) return;
    const next = Number(draft.next_number);
    setSaving(row.id);
    setFormError(null);
    try {
      await onSaveSeries(row.id, { series: draft.series, next_number: next });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar la serie');
    } finally {
      setSaving(null);
    }
  };

  if (!isOwner) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Configuración" subtitle="Solo el dueño edita el negocio" />
        <EmptyState title="Sin acceso" description="El cajero usa el local y los pagos ya configurados." />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="Configuración" subtitle="Identidad DIGEMID del negocio y del local activo" />
      {error || formError ? <Text style={styles.error}>{formError || error}</Text> : null}
      {loading.status === 'loading' && !organization ? <Text style={styles.muted}>Cargando…</Text> : null}

      <View style={styles.card}>
        <Text style={styles.section}>Negocio</Text>
        <Text style={styles.hint}>RUC y razón social del propietario. Un RUC, varios locales.</Text>
        <InputComponent label="Razón social" value={orgForm.name} onChangeText={(name) => setOrgForm({ ...orgForm, name })} />
        <InputComponent
          label="RUC"
          value={orgForm.ruc}
          onChangeText={(ruc) => setOrgForm({ ...orgForm, ruc })}
          keyboardType="number-pad"
          maxLength={11}
        />
        <InputComponent
          label="Domicilio fiscal"
          value={orgForm.tax_address}
          onChangeText={(tax_address) => setOrgForm({ ...orgForm, tax_address })}
        />
        <InputComponent
          label="Teléfono"
          value={orgForm.phone}
          onChangeText={(phone) => setOrgForm({ ...orgForm, phone })}
          keyboardType="phone-pad"
        />
        <InputComponent
          label="Correo"
          value={orgForm.email}
          onChangeText={(email) => setOrgForm({ ...orgForm, email })}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <ButtonComponent label="Guardar negocio" onPress={saveOrg} loading={saving === 'org'} />
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Local activo</Text>
        <Text style={styles.hint}>
          {activeStore ? `Estás editando ${activeStore.name}. Crea locales en Sucursales.` : 'Elige un local en Sucursales.'}
        </Text>
        <InputComponent
          label="Nombre comercial"
          value={storeForm.name}
          onChangeText={(name) => setStoreForm({ ...storeForm, name })}
        />
        <InputComponent
          label="Dirección del establecimiento"
          value={storeForm.address}
          onChangeText={(address) => setStoreForm({ ...storeForm, address })}
        />
        <InputComponent
          label="Distrito"
          value={storeForm.district}
          onChangeText={(district) => setStoreForm({ ...storeForm, district })}
        />
        <InputComponent
          label="Teléfono del local"
          value={storeForm.phone}
          onChangeText={(phone) => setStoreForm({ ...storeForm, phone })}
          keyboardType="phone-pad"
        />
        <InputComponent
          label="Horario de atención"
          value={storeForm.hours}
          onChangeText={(hours) => setStoreForm({ ...storeForm, hours })}
          placeholder="Lun–Sáb 8:00–21:00"
        />
        <InputComponent
          label="N° autorización sanitaria"
          value={storeForm.sanitary_auth}
          onChangeText={(sanitary_auth) => setStoreForm({ ...storeForm, sanitary_auth })}
        />
        <InputComponent
          label="Director técnico (QF)"
          value={storeForm.director_name}
          onChangeText={(director_name) => setStoreForm({ ...storeForm, director_name })}
        />
        <InputComponent
          label="Colegiatura"
          value={storeForm.director_license}
          onChangeText={(director_license) => setStoreForm({ ...storeForm, director_license })}
        />
        <ButtonComponent
          label="Guardar local"
          onPress={saveStore}
          loading={saving === 'store'}
          disabled={!activeStore}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Métodos de pago</Text>
        <Text style={styles.hint}>El efectivo no se desactiva. Los inactivos no aparecen en el cobro.</Text>
        {methods.map((method) => (
          <View key={method.id} style={styles.methodRow}>
            <InputComponent
              label={method.code === 'cash' ? 'Efectivo (siempre activo)' : method.code}
              value={methodNames[method.id] ?? method.name}
              onChangeText={(name) => setMethodNames((current) => ({ ...current, [method.id]: name }))}
            />
            <View style={styles.methodActions}>
              {method.code === 'cash' ? (
                <Text style={styles.meta}>Siempre activo</Text>
              ) : (
                <Pressable onPress={() => void toggleMethod(method)}>
                  <Text style={styles.toggle}>{method.is_active ? 'Activo (tocar para ocultar)' : 'Oculto (tocar para activar)'}</Text>
                </Pressable>
              )}
              <ButtonComponent
                variant="secondary"
                label="Guardar nombre"
                onPress={() => void saveMethod(method)}
                loading={saving === method.id}
              />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Series del local</Text>
        <Text style={styles.hint}>
          Comprobante interno. Cambiar el correlativo salta números; úsalo solo para alinear con papel ya usado.
        </Text>
        {series.map((row) => {
          const draft = seriesDraft[row.id] ?? { series: row.series, next_number: String(row.next_number) };
          return (
            <View key={row.id} style={styles.methodRow}>
              <InputComponent
                label={row.type === 'boleta' ? 'Serie boleta' : 'Serie factura'}
                value={draft.series}
                autoCapitalize="characters"
                onChangeText={(value) =>
                  setSeriesDraft((current) => ({
                    ...current,
                    [row.id]: { ...draft, series: value.toUpperCase() },
                  }))
                }
              />
              <InputComponent
                label="Siguiente número"
                value={draft.next_number}
                keyboardType="number-pad"
                onChangeText={(next_number) =>
                  setSeriesDraft((current) => ({ ...current, [row.id]: { ...draft, next_number } }))
                }
              />
              <ButtonComponent
                variant="secondary"
                label="Guardar serie"
                onPress={() => void saveSeriesRow(row)}
                loading={saving === row.id}
              />
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingVertical: space.lg, gap: space.lg, paddingBottom: space.xxl },
  error: { fontSize: fontSize.sm, color: colors.danger },
  muted: { color: colors.textMuted },
  card: { borderRadius: radius.lg, backgroundColor: colors.card, padding: space.lg, gap: space.md },
  section: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  hint: { fontSize: fontSize.xs, color: colors.textMuted },
  methodRow: { gap: space.sm },
  methodActions: { gap: space.sm },
  toggle: { fontSize: fontSize.sm, fontWeight: '500', color: colors.brand },
  meta: { fontSize: fontSize.xs, color: colors.textMuted },
});
