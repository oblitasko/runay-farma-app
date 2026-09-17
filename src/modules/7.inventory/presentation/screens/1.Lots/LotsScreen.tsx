import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { EmptyState, ScreenHeader } from '@/src/modules/_shared/components';
import { colors, fontSize, radius, space } from '@/src/modules/_shared/theme';
import { formatDate, formatPen, limaDateISO } from '@/src/modules/_shared/utils';
import { useAuthStore } from '@/src/modules/0.auth/domain/usecases';
import { useInventoryStore } from '../../../domain/usecases';

export function LotsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  const { lots, onLoadLots, loading } = useInventoryStore();
  const today = limaDateISO();

  useEffect(() => {
    if (activeStoreId && id) void onLoadLots(activeStoreId, id);
  }, [activeStoreId, id, onLoadLots]);

  const title = lots[0]?.product_name ?? 'Lotes';

  return (
    <View style={styles.screen}>
      <ScreenHeader title={title} subtitle="Lotes de la sucursal (FEFO al vender)" />
      <FlatList
        data={lots}
        keyExtractor={(item) => item.id}
        refreshing={loading.status === 'loading'}
        ListEmptyComponent={
          loading.status === 'loading' ? null : (
            <EmptyState title="Sin lotes" description="Este producto aún no tiene ingresos." />
          )
        }
        renderItem={({ item }) => {
          const expired = item.expires_on < today;
          return (
            <View style={styles.card}>
              <View style={styles.row}>
                <View>
                  <Text style={styles.name}>Lote {item.lot_code}</Text>
                  <Text style={[styles.meta, expired && styles.expired]}>Vence {formatDate(item.expires_on)}</Text>
                  <Text style={styles.meta}>Costo {formatPen(item.unit_cost)}</Text>
                </View>
                <Text style={styles.qty}>{item.quantity_on_hand}</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg, paddingTop: space.lg },
  card: {
    marginBottom: space.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textMuted },
  expired: { color: colors.danger, fontWeight: '600' },
  qty: { fontSize: fontSize.xl, fontWeight: '700', color: colors.brand },
});
