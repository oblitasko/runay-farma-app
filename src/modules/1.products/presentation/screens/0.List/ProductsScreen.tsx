import { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ButtonComponent, EmptyState, InputComponent, ScreenHeader } from '@/src/modules/_shared/components';
import { colors, fontSize, radius, space } from '@/src/modules/_shared/theme';
import { formatPen, parseMoneyInput } from '@/src/modules/_shared/utils';
import { useAuthStore } from '@/src/modules/0.auth/domain/usecases';
import type { Product } from '../../../domain/entities';
import { useProductsStore } from '../../../domain/usecases';

type FormState = {
  name: string;
  sale_price: string;
  barcode: string;
  sku: string;
  is_active: boolean;
};

const emptyForm: FormState = { name: '', sale_price: '', barcode: '', sku: '', is_active: true };

export function ProductsScreen() {
  const profile = useAuthStore((state) => state.profile);
  const isOwner = profile?.role === 'owner';
  const { items, search, setSearch, onLoad, onCreate, onUpdate, loading, error } = useProductsStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.organization_id) {
      void onLoad(profile.organization_id);
    }
  }, [profile?.organization_id, onLoad]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (product: Product) => {
    if (!isOwner) return;
    setEditing(product);
    setForm({
      name: product.name,
      sale_price: String(product.sale_price),
      barcode: product.barcode ?? '',
      sku: product.sku ?? '',
      is_active: product.is_active,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const save = async () => {
    if (!profile) return;
    const price = parseMoneyInput(form.sale_price);
    if (!form.name.trim() || price <= 0) {
      setFormError('Nombre y precio son obligatorios');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        organization_id: profile.organization_id,
        name: form.name,
        sale_price: price,
        barcode: form.barcode,
        sku: form.sku,
        is_active: form.is_active,
      };
      if (editing) {
        await onUpdate(editing.id, payload);
      } else {
        await onCreate(payload);
      }
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
        title="Productos"
        subtitle={isOwner ? 'Catálogo de la botica' : 'Consulta de precios'}
        right={isOwner ? <ButtonComponent label="Nuevo" onPress={openCreate} /> : undefined}
      />
      <InputComponent
        label="Buscar"
        value={search}
        onChangeText={(value) => {
          setSearch(value);
          if (profile?.organization_id) void onLoad(profile.organization_id, value);
        }}
        placeholder="Nombre, código de barras o SKU"
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
            <EmptyState title="Sin productos" description="Agrega el primer producto para empezar a vender." />
          )
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => openEdit(item)}>
            <View style={styles.row}>
              <View style={styles.copy}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  {item.barcode || item.sku || 'Sin código'} {!item.is_active ? '· Inactivo' : ''}
                </Text>
              </View>
              <Text style={styles.price}>{formatPen(Number(item.sale_price))}</Text>
            </View>
          </Pressable>
        )}
      />

      <Modal visible={formOpen} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{editing ? 'Editar producto' : 'Nuevo producto'}</Text>
            <View style={styles.form}>
              <InputComponent label="Nombre" value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
              <InputComponent
                label="Precio de venta (S/)"
                value={form.sale_price}
                onChangeText={(sale_price) => setForm({ ...form, sale_price })}
                keyboardType="decimal-pad"
              />
              <InputComponent
                label="Código de barras"
                value={form.barcode}
                onChangeText={(barcode) => setForm({ ...form, barcode })}
              />
              <InputComponent label="SKU" value={form.sku} onChangeText={(sku) => setForm({ ...form, sku })} />
              {editing ? (
                <Pressable onPress={() => setForm({ ...form, is_active: !form.is_active })}>
                  <Text style={styles.toggle}>
                    {form.is_active ? 'Producto activo (tocar para desactivar)' : 'Producto inactivo (tocar para activar)'}
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
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  copy: { flex: 1, paddingRight: space.md },
  name: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textMuted },
  price: { fontSize: fontSize.md, fontWeight: '700', color: colors.brand },
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
