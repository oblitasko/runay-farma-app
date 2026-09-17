import { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ButtonComponent, EmptyState, InputComponent, ScreenHeader } from '@/src/modules/_shared/components';
import { colors, fontSize, radius, space } from '@/src/modules/_shared/theme';
import { useAuthStore } from '@/src/modules/0.auth/domain/usecases';
import type { Supplier } from '../../../domain/entities';
import { useSuppliersStore } from '../../../domain/usecases';

type FormState = { name: string; ruc: string; phone: string; is_active: boolean };
const emptyForm: FormState = { name: '', ruc: '', phone: '', is_active: true };

export function SuppliersScreen() {
  const profile = useAuthStore((state) => state.profile);
  const isOwner = profile?.role === 'owner';
  const { items, search, setSearch, onLoad, onCreate, onUpdate, loading, error } = useSuppliersStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.organization_id) void onLoad(profile.organization_id);
  }, [profile?.organization_id, onLoad]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    if (!isOwner) return;
    setEditing(supplier);
    setForm({
      name: supplier.name,
      ruc: supplier.ruc ?? '',
      phone: supplier.phone ?? '',
      is_active: supplier.is_active,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const save = async () => {
    if (!profile) return;
    if (!form.name.trim()) {
      setFormError('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        organization_id: profile.organization_id,
        name: form.name,
        ruc: form.ruc,
        phone: form.phone,
        is_active: form.is_active,
      };
      if (editing) await onUpdate(editing.id, payload);
      else await onCreate(payload);
      setFormOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Proveedores"
        subtitle={isOwner ? 'Laboratorios y distribuidores' : 'Consulta'}
        right={isOwner ? <ButtonComponent label="Nuevo" onPress={openCreate} /> : undefined}
      />
      <InputComponent
        label="Buscar"
        value={search}
        placeholder="Nombre o RUC"
        onChangeText={(value) => {
          setSearch(value);
          if (profile?.organization_id) void onLoad(profile.organization_id, value);
        }}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        style={styles.list}
        data={items}
        keyExtractor={(item) => item.id}
        refreshing={loading.status === 'loading'}
        onRefresh={() => profile?.organization_id && onLoad(profile.organization_id)}
        ListEmptyComponent={
          loading.status === 'loading' ? null : (
            <EmptyState title="Sin proveedores" description="Registra el primer proveedor para ingresar compras." />
          )
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => openEdit(item)}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {item.ruc || 'Sin RUC'}
              {item.phone ? ` · ${item.phone}` : ''}
              {!item.is_active ? ' · Inactivo' : ''}
            </Text>
          </Pressable>
        )}
      />

      <Modal visible={formOpen} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{editing ? 'Editar proveedor' : 'Nuevo proveedor'}</Text>
            <View style={styles.form}>
              <InputComponent label="Nombre" value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
              <InputComponent label="RUC" value={form.ruc} onChangeText={(ruc) => setForm({ ...form, ruc })} keyboardType="number-pad" />
              <InputComponent label="Teléfono" value={form.phone} onChangeText={(phone) => setForm({ ...form, phone })} keyboardType="phone-pad" />
              {editing ? (
                <Pressable onPress={() => setForm({ ...form, is_active: !form.is_active })}>
                  <Text style={styles.toggle}>
                    {form.is_active ? 'Proveedor activo (tocar para desactivar)' : 'Proveedor inactivo (tocar para activar)'}
                  </Text>
                </Pressable>
              ) : null}
              {formError ? <Text style={styles.formError}>{formError}</Text> : null}
              <ButtonComponent label="Guardar" onPress={save} loading={saving} />
              <ButtonComponent variant="ghost" label="Cancelar" onPress={() => setFormOpen(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg, paddingTop: space.lg },
  error: { marginTop: space.md, fontSize: fontSize.sm, color: colors.danger },
  list: { marginTop: space.lg },
  card: {
    marginBottom: space.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  name: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textMuted },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.card,
    padding: 20,
  },
  sheetTitle: { marginBottom: space.lg, fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  form: { gap: space.md },
  toggle: { fontSize: fontSize.sm, fontWeight: '500', color: colors.brand },
  formError: { fontSize: fontSize.sm, color: colors.danger },
});
