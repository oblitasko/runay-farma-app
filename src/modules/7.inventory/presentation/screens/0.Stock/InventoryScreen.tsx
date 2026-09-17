import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ButtonComponent, EmptyState, ScreenHeader } from '@/src/modules/_shared/components';
import { colors, fontSize, radius, space } from '@/src/modules/_shared/theme';
import { formatDate, formatPen } from '@/src/modules/_shared/utils';
import { useAuthStore } from '@/src/modules/0.auth/domain/usecases';
import type { StockRow } from '../../../domain/entities';
import { useInventoryNavigation, useInventoryStore } from '../../../domain/usecases';

type Filter = 'all' | 'min' | 'expiry';

export function InventoryScreen({ lockedFilter }: { lockedFilter?: Filter }) {
  const params = useLocalSearchParams<{ filter?: string }>();
  const profile = useAuthStore((state) => state.profile);
  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  const { stock, filter, setFilter, onLoadStock, loading, error } = useInventoryStore();
  const { goToLots, goToAlerts } = useInventoryNavigation();
  const activeFilter: Filter =
    lockedFilter ?? (params.filter === 'min' || params.filter === 'expiry' ? params.filter : filter);

  useEffect(() => {
    if (lockedFilter) setFilter(lockedFilter);
    else if (params.filter === 'min' || params.filter === 'expiry') setFilter(params.filter);
  }, [lockedFilter, params.filter, setFilter]);

  useEffect(() => {
    if (profile?.organization_id && activeStoreId) {
      void onLoadStock(profile.organization_id, activeStoreId);
    }
  }, [profile?.organization_id, activeStoreId, onLoadStock]);

  const rows = stock.filter((row) => {
    if (activeFilter === 'min') return row.isBelowMin;
    if (activeFilter === 'expiry') return row.hasExpiring30 || row.hasExpired;
    return true;
  });

  const title = lockedFilter === 'expiry' ? 'Vencimientos' : 'Inventario';
  const subtitle =
    lockedFilter === 'expiry' ? 'Lotes vencidos o que vencen en 30 días' : 'Stock vendible por producto';

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={title}
        subtitle={subtitle}
        right={lockedFilter ? undefined : <ButtonComponent variant="secondary" label="Alertas" onPress={goToAlerts} />}
      />
      {lockedFilter ? null : (
        <View style={styles.chips}>
          {(
            [
              { id: 'all' as const, label: 'Todo' },
              { id: 'min' as const, label: 'Stock mínimo' },
              { id: 'expiry' as const, label: 'Vencimientos' },
            ]
          ).map((chip) => {
            const selected = activeFilter === chip.id;
            return (
              <Pressable key={chip.id} style={[styles.chip, selected ? styles.chipOn : styles.chipOff]} onPress={() => setFilter(chip.id)}>
                <Text style={selected ? styles.chipOnText : styles.chipOffText}>{chip.label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={rows}
        keyExtractor={(item) => item.productId}
        refreshing={loading.status === 'loading'}
        onRefresh={() => profile?.organization_id && activeStoreId && onLoadStock(profile.organization_id, activeStoreId)}
        ListEmptyComponent={
          loading.status === 'loading' ? null : (
            <EmptyState title="Sin movimientos" description="Recibe una compra para ver stock y lotes." />
          )
        }
        renderItem={({ item }) => <StockCard row={item} onPress={() => goToLots(item.productId)} />}
      />
    </View>
  );
}

function StockCard({ row, onPress }: { row: StockRow; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.name}>{row.name}</Text>
          <Text style={styles.meta}>
            {row.barcode || row.sku || 'Sin código'} · Mín. {row.minStock}
          </Text>
          {row.nearestExpiry ? <Text style={styles.meta}>Próximo vencimiento {formatDate(row.nearestExpiry)}</Text> : null}
          {row.isBelowMin ? <Text style={styles.alert}>Bajo stock mínimo</Text> : null}
          {row.hasExpired ? <Text style={styles.alert}>Hay lote vencido</Text> : null}
          {row.hasExpiring30 && !row.hasExpired ? <Text style={styles.warn}>Vence en 30 días o menos</Text> : null}
        </View>
        <View style={styles.qtyBox}>
          <Text style={styles.qty}>{row.sellable}</Text>
          <Text style={styles.price}>{formatPen(row.salePrice)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg, paddingTop: space.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.md },
  chip: { borderRadius: radius.full, paddingHorizontal: space.md, paddingVertical: 4 },
  chipOn: { backgroundColor: colors.brand },
  chipOff: { backgroundColor: '#F1F5F9' },
  chipOnText: { color: colors.white },
  chipOffText: { color: '#334155' },
  error: { marginBottom: space.md, fontSize: fontSize.sm, color: colors.danger },
  card: {
    marginBottom: space.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  copy: { flex: 1, paddingRight: space.md },
  name: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textMuted },
  alert: { marginTop: 4, fontSize: fontSize.xs, fontWeight: '600', color: colors.danger },
  warn: { marginTop: 4, fontSize: fontSize.xs, fontWeight: '600', color: colors.warningBody },
  qtyBox: { alignItems: 'flex-end' },
  qty: { fontSize: fontSize.xl, fontWeight: '700', color: colors.brand },
  price: { fontSize: fontSize.xs, color: colors.textMuted },
});
