import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState, InputComponent, ScreenHeader } from '@/src/modules/_shared/components';
import { colors, fontSize, radius, space } from '@/src/modules/_shared/theme';
import { useAuthStore } from '@/src/modules/0.auth/domain/usecases';
import type { StockRow } from '../../../domain/entities';
import { useInventoryNavigation, useInventoryStore } from '../../../domain/usecases';

export function KardexScreen() {
  const profile = useAuthStore((state) => state.profile);
  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  const { stock, onLoadStock, loading, error } = useInventoryStore();
  const { goToKardexProduct } = useInventoryNavigation();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (profile?.organization_id && activeStoreId) {
      void onLoadStock(profile.organization_id, activeStoreId);
    }
  }, [profile?.organization_id, activeStoreId, onLoadStock]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return stock.filter((row) => {
      if (!query) return true;
      return (
        row.name.toLowerCase().includes(query) ||
        (row.sku ?? '').toLowerCase().includes(query) ||
        (row.barcode ?? '').toLowerCase().includes(query)
      );
    });
  }, [stock, search]);

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Kardex" subtitle="Entradas, salidas y saldo por lote" />
      <View style={styles.search}>
        <InputComponent
          label="Buscar producto"
          value={search}
          onChangeText={setSearch}
          placeholder="Nombre, SKU o código"
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={rows}
        keyExtractor={(item) => item.productId}
        refreshing={loading.status === 'loading'}
        onRefresh={() =>
          profile?.organization_id && activeStoreId && onLoadStock(profile.organization_id, activeStoreId)
        }
        ListEmptyComponent={
          loading.status === 'loading' ? null : (
            <EmptyState title="Sin productos" description="Recibe una compra para ver el kardex." />
          )
        }
        renderItem={({ item }) => <KardexProductCard row={item} onPress={() => goToKardexProduct(item.productId)} />}
      />
    </View>
  );
}

function KardexProductCard({ row, onPress }: { row: StockRow; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.name}>{row.name}</Text>
          <Text style={styles.meta}>
            {row.barcode || row.sku || 'Sin código'} · {row.presentation}
          </Text>
        </View>
        <Text style={styles.qty}>{row.onHand}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg, paddingTop: space.lg },
  search: { marginBottom: space.md },
  error: { marginVertical: space.md, fontSize: fontSize.sm, color: colors.danger },
  card: {
    marginBottom: space.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  copy: { flex: 1, paddingRight: space.md },
  name: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textMuted },
  qty: { fontSize: fontSize.xl, fontWeight: '700', color: colors.brand },
});
