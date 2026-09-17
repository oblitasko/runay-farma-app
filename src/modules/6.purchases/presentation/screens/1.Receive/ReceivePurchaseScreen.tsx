import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ButtonComponent, InputComponent, ScreenHeader } from '@/src/modules/_shared/components';
import { colors, fontSize, radius, space } from '@/src/modules/_shared/theme';
import { parseMoneyInput } from '@/src/modules/_shared/utils';
import { useAuthStore } from '@/src/modules/0.auth/domain/usecases';
import { useProductsStore } from '@/src/modules/1.products/domain/usecases';
import { useSuppliersStore } from '@/src/modules/5.suppliers/domain/usecases';
import { usePurchasesNavigation, usePurchasesStore } from '../../../domain/usecases';

type Line = { productId: string; lotCode: string; expiresOn: string; quantity: string; unitCost: string };

const emptyLine: Line = { productId: '', lotCode: '', expiresOn: '', quantity: '', unitCost: '0' };

export function ReceivePurchaseScreen() {
  const profile = useAuthStore((state) => state.profile);
  const { items: suppliers, onLoad: onLoadSuppliers } = useSuppliersStore();
  const { items: products, onLoad: onLoadProducts } = useProductsStore();
  const { onReceive, loading, error } = usePurchasesStore();
  const { goToPurchases } = usePurchasesNavigation();
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Line[]>([{ ...emptyLine }]);
  const [localError, setLocalError] = useState<string | null>(null);

  const activeSuppliers = suppliers.filter((item) => item.is_active);
  const activeProducts = products.filter((item) => item.is_active);

  useEffect(() => {
    if (profile?.organization_id) {
      void onLoadSuppliers(profile.organization_id);
      void onLoadProducts(profile.organization_id);
    }
  }, [profile?.organization_id, onLoadSuppliers, onLoadProducts]);

  useEffect(() => {
    if (!supplierId && activeSuppliers[0]) setSupplierId(activeSuppliers[0].id);
  }, [activeSuppliers, supplierId]);

  const save = async () => {
    setLocalError(null);
    if (!profile?.store_id) return;
    if (!supplierId) {
      setLocalError('Elige un proveedor');
      return;
    }
    const parsed = lines
      .map((line) => ({
        product_id: line.productId,
        lot_code: line.lotCode.trim(),
        expires_on: line.expiresOn.trim(),
        quantity: parseMoneyInput(line.quantity),
        unit_cost: parseMoneyInput(line.unitCost),
      }))
      .filter((line) => line.product_id || line.lot_code || line.expires_on || line.quantity > 0);

    if (!parsed.length) {
      setLocalError('Agrega al menos un producto');
      return;
    }
    if (parsed.some((line) => !line.product_id || !line.lot_code || !/^\d{4}-\d{2}-\d{2}$/.test(line.expires_on) || line.quantity <= 0)) {
      setLocalError('Cada línea necesita producto, lote, vencimiento YYYY-MM-DD y cantidad');
      return;
    }
    try {
      await onReceive(profile.store_id, supplierId, notes, parsed);
      goToPurchases();
    } catch {
      // error en el store
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="Recibir mercadería" subtitle="Cada línea crea o aumenta un lote" />
      <Text style={styles.section}>Proveedor</Text>
      <View style={styles.chips}>
        {activeSuppliers.map((item) => {
          const selected = item.id === supplierId;
          return (
            <Pressable key={item.id} style={[styles.chip, selected ? styles.chipOn : styles.chipOff]} onPress={() => setSupplierId(item.id)}>
              <Text style={selected ? styles.chipOnText : styles.chipOffText}>{item.name}</Text>
            </Pressable>
          );
        })}
      </View>
      {!activeSuppliers.length ? <Text style={styles.hint}>No hay proveedores activos. El dueño debe registrarlos.</Text> : null}

      {lines.map((line, index) => {
        const product = activeProducts.find((item) => item.id === line.productId);
        return (
          <View key={index} style={styles.card}>
            <Text style={styles.section}>Producto {index + 1}</Text>
            <View style={styles.chips}>
              {activeProducts.map((item) => {
                const selected = item.id === line.productId;
                return (
                  <Pressable
                    key={item.id}
                    style={[styles.chip, selected ? styles.chipOn : styles.chipOff]}
                    onPress={() => {
                      const next = [...lines];
                      next[index] = { ...line, productId: item.id };
                      setLines(next);
                    }}
                  >
                    <Text style={selected ? styles.chipOnText : styles.chipOffText}>{item.name}</Text>
                  </Pressable>
                );
              })}
            </View>
            <InputComponent
              label="Lote"
              value={line.lotCode}
              onChangeText={(lotCode) => {
                const next = [...lines];
                next[index] = { ...line, lotCode };
                setLines(next);
              }}
            />
            <InputComponent
              label="Vence (YYYY-MM-DD)"
              value={line.expiresOn}
              placeholder="2027-06-30"
              onChangeText={(expiresOn) => {
                const next = [...lines];
                next[index] = { ...line, expiresOn };
                setLines(next);
              }}
            />
            <InputComponent
              label="Cantidad"
              value={line.quantity}
              keyboardType="decimal-pad"
              onChangeText={(quantity) => {
                const next = [...lines];
                next[index] = { ...line, quantity };
                setLines(next);
              }}
            />
            <InputComponent
              label={`Costo unitario (S/) ${product ? product.name : ''}`}
              value={line.unitCost}
              keyboardType="decimal-pad"
              onChangeText={(unitCost) => {
                const next = [...lines];
                next[index] = { ...line, unitCost };
                setLines(next);
              }}
            />
            {lines.length > 1 ? (
              <ButtonComponent variant="ghost" label="Quitar línea" onPress={() => setLines(lines.filter((_, i) => i !== index))} />
            ) : null}
          </View>
        );
      })}

      <ButtonComponent variant="secondary" label="Agregar producto" onPress={() => setLines([...lines, { ...emptyLine }])} />
      <View style={styles.notes}>
        <InputComponent label="Notas (opcional)" value={notes} onChangeText={setNotes} />
      </View>
      {localError || error ? <Text style={styles.error}>{localError || error}</Text> : null}
      <View style={styles.actions}>
        <ButtonComponent label="Confirmar ingreso" onPress={save} loading={loading.status === 'loading'} disabled={!activeSuppliers.length} />
        <ButtonComponent variant="ghost" label="Volver" onPress={goToPurchases} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingVertical: space.lg, gap: space.md },
  section: { marginBottom: space.sm, fontWeight: '600', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.md },
  chip: { borderRadius: radius.full, paddingHorizontal: space.md, paddingVertical: 4 },
  chipOn: { backgroundColor: colors.brand },
  chipOff: { backgroundColor: '#F1F5F9' },
  chipOnText: { color: colors.white },
  chipOffText: { color: '#334155' },
  hint: { fontSize: fontSize.sm, color: colors.textMuted },
  card: { borderRadius: radius.lg, backgroundColor: colors.card, padding: space.lg },
  notes: { marginTop: space.sm },
  error: { fontSize: fontSize.sm, color: colors.danger },
  actions: { gap: space.sm, marginTop: space.sm },
});
