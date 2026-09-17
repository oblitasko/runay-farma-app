import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState, ScreenHeader } from '@/src/modules/_shared/components';
import { colors, fontSize, radius, space } from '@/src/modules/_shared/theme';
import { formatPen } from '@/src/modules/_shared/utils';
import { useAuthStore } from '@/src/modules/0.auth/domain/usecases';
import { useReportsStore } from '../../../domain/usecases';

export function StatsScreen() {
  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  const stores = useAuthStore((state) => state.stores);
  const { period, periodDays, onLoadPeriod, loading, error } = useReportsStore();

  useEffect(() => {
    if (activeStoreId) void onLoadPeriod(activeStoreId, periodDays, stores);
  }, [activeStoreId, periodDays, stores, onLoadPeriod]);

  const maxMethod = Math.max(1, ...(period?.byMethod.map((item) => item.amount) ?? [1]));
  const maxProduct = Math.max(1, ...(period?.topProducts.map((item) => item.quantity) ?? [1]));
  const maxStore = Math.max(1, ...(period?.byStore.map((item) => item.total) ?? [1]));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="Estadísticas" subtitle="Totales en hora de Lima" />
      <View style={styles.chips}>
        {([7, 30] as const).map((days) => {
          const selected = periodDays === days;
          return (
            <Pressable
              key={days}
              style={[styles.chip, selected ? styles.chipOn : styles.chipOff]}
              onPress={() => activeStoreId && onLoadPeriod(activeStoreId, days, stores)}
            >
              <Text style={selected ? styles.chipOnText : styles.chipOffText}>{days} días</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading.status === 'loading' && !period ? <Text style={styles.muted}>Cargando estadísticas…</Text> : null}
      {period && period.salesCount === 0 ? (
        <EmptyState title="Sin ventas" description="No hay ventas en el rango elegido." />
      ) : period ? (
        <View style={styles.stats}>
          <View style={styles.card}>
            <Text style={styles.label}>Ventas</Text>
            <Text style={styles.hero}>{period.salesCount}</Text>
            <Text style={styles.meta}>
              {period.fromISO} a {period.toISO}
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.label}>Total</Text>
            <Text style={[styles.hero, styles.brand]}>{formatPen(period.total)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.label}>Ticket promedio</Text>
            <Text style={styles.hero}>{formatPen(period.averageTicket)}</Text>
          </View>

          <Text style={styles.section}>Por método</Text>
          {period.byMethod.map((method) => (
            <View key={method.code} style={styles.barCard}>
              <View style={styles.barRow}>
                <Text style={styles.barLabel}>{method.name}</Text>
                <Text style={styles.barValue}>{formatPen(method.amount)}</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${(method.amount / maxMethod) * 100}%` }]} />
              </View>
            </View>
          ))}

          <Text style={styles.section}>Top productos</Text>
          {period.topProducts.length === 0 ? <Text style={styles.muted}>Sin productos vendidos.</Text> : null}
          {period.topProducts.map((item) => (
            <View key={item.productId} style={styles.barCard}>
              <View style={styles.barRow}>
                <Text style={styles.barLabel}>{item.name}</Text>
                <Text style={styles.barValue}>
                  {item.quantity} · {formatPen(item.total)}
                </Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${(item.quantity / maxProduct) * 100}%` }]} />
              </View>
            </View>
          ))}

          {period.byStore.length > 1 ? (
            <>
              <Text style={styles.section}>Por local</Text>
              {period.byStore.map((item) => (
                <View key={item.storeId} style={styles.barCard}>
                  <View style={styles.barRow}>
                    <Text style={styles.barLabel}>{item.storeName}</Text>
                    <Text style={styles.barValue}>
                      {item.salesCount} · {formatPen(item.total)}
                    </Text>
                  </View>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${(item.total / maxStore) * 100}%` }]} />
                  </View>
                </View>
              ))}
            </>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingVertical: space.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg },
  chip: { borderRadius: radius.full, paddingHorizontal: space.md, paddingVertical: 4 },
  chipOn: { backgroundColor: colors.brand },
  chipOff: { backgroundColor: '#F1F5F9' },
  chipOnText: { color: colors.white },
  chipOffText: { color: '#334155' },
  error: { marginBottom: space.md, fontSize: fontSize.sm, color: colors.danger },
  muted: { fontSize: fontSize.sm, color: colors.textMuted },
  stats: { gap: space.md },
  card: { borderRadius: radius.lg, backgroundColor: colors.card, padding: space.lg },
  label: { fontSize: fontSize.sm, color: colors.textMuted },
  hero: { fontSize: fontSize.hero, fontWeight: '700', color: colors.text },
  brand: { color: colors.brand },
  meta: { marginTop: 4, fontSize: fontSize.xs, color: colors.textMuted },
  section: { marginTop: space.sm, fontWeight: '700', color: colors.text },
  barCard: { borderRadius: radius.lg, backgroundColor: colors.card, padding: space.lg },
  barRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md, marginBottom: space.sm },
  barLabel: { flex: 1, color: colors.text },
  barValue: { fontWeight: '600', color: colors.text },
  track: { height: 8, borderRadius: radius.full, backgroundColor: '#F1F5F9', overflow: 'hidden' },
  fill: { height: 8, borderRadius: radius.full, backgroundColor: colors.brand },
});
