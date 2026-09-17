import { useEffect } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { EmptyState, ScreenHeader } from '@/src/modules/_shared/components';
import { colors, fontSize, radius, space } from '@/src/modules/_shared/theme';
import { useAuthStore } from '@/src/modules/0.auth/domain/usecases';
import { useInventoryStore } from '../../../domain/usecases';

export function RestockScreen() {
  const profile = useAuthStore((state) => state.profile);
  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  const isOwner = profile?.role === 'owner';
  const { restock, onLoadRestock, loading, error } = useInventoryStore();

  useEffect(() => {
    if (isOwner && profile?.organization_id && activeStoreId) {
      void onLoadRestock(profile.organization_id, activeStoreId);
    }
  }, [isOwner, profile?.organization_id, activeStoreId, onLoadRestock]);

  if (!isOwner) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Reposición" subtitle="Solo el dueño ve la predicción de compras" />
        <EmptyState title="Sin acceso" description="Pide al dueño que revise las sugerencias de compra." />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Reposición"
        subtitle="Promedio de 30 días × 7 días de cobertura, menos stock vendible"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={restock}
        keyExtractor={(item) => item.productId}
        refreshing={loading.status === 'loading'}
        onRefresh={() =>
          profile?.organization_id && activeStoreId && onLoadRestock(profile.organization_id, activeStoreId)
        }
        ListEmptyComponent={
          loading.status === 'loading' ? null : (
            <EmptyState
              title="Nada que reponer"
              description="Con el promedio de ventas de 30 días, el stock cubre 7 días."
            />
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.copy}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  Vendible {item.sellable} · Promedio {item.avgDaily}/día
                </Text>
              </View>
              <Text style={styles.qty}>{item.suggested}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg, paddingTop: space.lg },
  error: { marginBottom: space.md, fontSize: fontSize.sm, color: colors.danger },
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
