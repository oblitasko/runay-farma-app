import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState, ScreenHeader } from '@/src/modules/_shared/components';
import { colors, fontSize, radius, space } from '@/src/modules/_shared/theme';
import { useAuthStore } from '@/src/modules/0.auth/domain/usecases';
import type { StockRow } from '../../../domain/entities';
import { useInventoryStore } from '../../../domain/usecases';

export function AlertsScreen() {
  const profile = useAuthStore((state) => state.profile);
  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  const { stock, onLoadStock, loading, error } = useInventoryStore();

  useEffect(() => {
    if (profile?.organization_id && activeStoreId) {
      void onLoadStock(profile.organization_id, activeStoreId);
    }
  }, [profile?.organization_id, activeStoreId, onLoadStock]);

  const expired = stock.filter((row) => row.hasExpired);
  const expiring = stock.filter((row) => row.hasExpiring30 && !row.hasExpired);
  const low = stock.filter((row) => row.isBelowMin);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="Alertas" subtitle="Vencidos, 30 días y stock mínimo" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading.status === 'loading' && !stock.length ? <Text style={styles.muted}>Cargando alertas…</Text> : null}
      {!expired.length && !expiring.length && !low.length && loading.status !== 'loading' ? (
        <EmptyState title="Sin alertas" description="El stock vendible y los vencimientos están al día." />
      ) : null}
      <AlertGroup title="Vencidos" rows={expired} empty="No hay lotes vencidos con stock." />
      <AlertGroup title="Vencen en 30 días" rows={expiring} empty="Nada por vencer en 30 días." />
      <AlertGroup title="Stock mínimo" rows={low} empty="Nadie está bajo el mínimo." />
    </ScrollView>
  );
}

function AlertGroup({ title, rows, empty }: { title: string; rows: StockRow[]; empty: string }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>
        {title} ({rows.length})
      </Text>
      {rows.length === 0 ? <Text style={styles.muted}>{empty}</Text> : null}
      {rows.map((row) => (
        <View key={`${title}-${row.productId}`} style={styles.card}>
          <Text style={styles.name}>{row.name}</Text>
          <Text style={styles.meta}>
            Vendible {row.sellable}
            {row.minStock ? ` · Mín. ${row.minStock}` : ''}
            {row.nearestExpiry ? ` · Vence ${row.nearestExpiry}` : ''}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingVertical: space.lg },
  error: { marginBottom: space.md, fontSize: fontSize.sm, color: colors.danger },
  muted: { fontSize: fontSize.sm, color: colors.textMuted },
  group: { marginBottom: space.xl },
  groupTitle: { marginBottom: space.sm, fontWeight: '700', color: colors.text },
  card: {
    marginBottom: space.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  name: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textMuted },
});
