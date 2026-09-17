import { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState, ScreenHeader } from '@/src/modules/_shared/components';
import { colors, fontSize, radius, space } from '@/src/modules/_shared/theme';
import { formatDateTime, formatPen, limaDateISO } from '@/src/modules/_shared/utils';
import { useAuthStore } from '@/src/modules/0.auth/domain/usecases';
import { useSalesNavigation, useSalesStore } from '../../../domain/usecases';

export function HistoryScreen() {
  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  const { history, onLoadHistory, loading, error } = useSalesStore();
  const { goToDetail } = useSalesNavigation();

  useEffect(() => {
    if (activeStoreId) void onLoadHistory(activeStoreId, limaDateISO());
  }, [activeStoreId, onLoadHistory]);

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Historial" subtitle="Ventas de hoy (hora Lima)" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        refreshing={loading.status === 'loading'}
        onRefresh={() => activeStoreId && onLoadHistory(activeStoreId)}
        ListEmptyComponent={
          loading.status === 'loading' ? null : (
            <EmptyState title="Sin ventas hoy" description="Las ventas aparecerán aquí al cobrar." />
          )
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => goToDetail(item.id)}>
            <View style={styles.row}>
              <View>
                <Text style={styles.title}>{formatDateTime(item.created_at)}</Text>
                <Text style={styles.meta}>{item.sale_items?.length ?? 0} productos</Text>
              </View>
              <Text style={styles.price}>{formatPen(Number(item.total))}</Text>
            </View>
          </Pressable>
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
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textMuted },
  price: { fontSize: fontSize.md, fontWeight: '700', color: colors.brand },
});
