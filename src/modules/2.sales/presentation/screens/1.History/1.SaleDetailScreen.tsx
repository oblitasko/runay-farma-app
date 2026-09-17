import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '@/src/modules/_shared/components';
import { colors, fontSize, radius, space } from '@/src/modules/_shared/theme';
import { formatDateTime, formatPen } from '@/src/modules/_shared/utils';
import { paymentMethodInfo } from '../../../domain/entities';
import { useSalesStore } from '../../../domain/usecases';

export function SaleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedSale, onLoadSale } = useSalesStore();

  useEffect(() => {
    if (id) void onLoadSale(id);
  }, [id, onLoadSale]);

  if (!selectedSale) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Cargando venta…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="Detalle de venta" subtitle={formatDateTime(selectedSale.created_at)} />
      {(selectedSale.sale_items ?? []).map((item) => (
        <View key={item.id} style={styles.line}>
          <Text style={styles.lineText}>
            {item.quantity} × {item.product_name}
          </Text>
          <Text style={styles.strong}>{formatPen(Number(item.subtotal))}</Text>
        </View>
      ))}
      <Text style={styles.section}>Pagos</Text>
      {(selectedSale.sale_payments ?? []).map((payment) => (
        <View key={payment.id} style={styles.line}>
          <Text style={styles.lineText}>{paymentMethodInfo(payment).name}</Text>
          <Text style={styles.strong}>{formatPen(Number(payment.amount))}</Text>
        </View>
      ))}
      <Text style={styles.total}>{formatPen(Number(selectedSale.total))}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingVertical: space.lg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  muted: { color: colors.textMuted },
  line: {
    marginBottom: space.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  lineText: { flex: 1, color: colors.text },
  strong: { fontWeight: '600' },
  section: { marginBottom: space.sm, marginTop: space.lg, fontWeight: '600', color: colors.text },
  total: { marginTop: space.lg, textAlign: 'right', fontSize: fontSize.xl, fontWeight: '700', color: colors.brand },
});
