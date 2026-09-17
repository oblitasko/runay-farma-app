import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState, ScreenHeader } from '@/src/modules/_shared/components';
import { colors, fontSize, radius, space } from '@/src/modules/_shared/theme';
import { formatDate, formatDateTime } from '@/src/modules/_shared/utils';
import { useAuthStore } from '@/src/modules/0.auth/domain/usecases';
import type { KardexLine, KardexPeriod } from '../../../domain/entities';
import { kardexDocumentLabel } from '../../../domain/entities';
import { useInventoryStore } from '../../../domain/usecases';
import { InventoryPort } from '../../../ports';

const PERIODS: { id: KardexPeriod; label: string }[] = [
  { id: 7, label: '7 días' },
  { id: 30, label: '30 días' },
  { id: 365, label: '12 meses' },
  { id: 'all', label: 'Todo' },
];

export function KardexDetailScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  const {
    kardex,
    kardexPeriod,
    kardexLot,
    setKardexPeriod,
    setKardexLot,
    onLoadKardex,
    loading,
    error,
  } = useInventoryStore();

  useEffect(() => {
    if (activeStoreId && productId) void onLoadKardex(activeStoreId, productId);
  }, [activeStoreId, productId, onLoadKardex]);

  const view = useMemo(
    () => InventoryPort.sliceKardex(kardex, kardexPeriod, kardexLot),
    [kardex, kardexPeriod, kardexLot],
  );
  const title = kardex[0]?.product_name ?? 'Kardex';
  const presentation = kardex[0]?.presentation;
  const currentBalance = kardex.at(-1)?.product_balance ?? 0;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={title}
        subtitle={
          presentation
            ? `${presentation} · Saldo actual ${currentBalance}`
            : 'Historial de entradas y salidas'
        }
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.chips}>
        {PERIODS.map((period) => {
          const selected = kardexPeriod === period.id;
          return (
            <Pressable
              key={String(period.id)}
              style={[styles.chip, selected ? styles.chipOn : styles.chipOff]}
              onPress={() => setKardexPeriod(period.id)}
            >
              <Text style={selected ? styles.chipOnText : styles.chipOffText}>{period.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {view.lotCodes.length > 1 ? (
        <View style={styles.chips}>
          <Pressable
            style={[styles.chip, !kardexLot ? styles.chipOn : styles.chipOff]}
            onPress={() => setKardexLot(null)}
          >
            <Text style={!kardexLot ? styles.chipOnText : styles.chipOffText}>Todos los lotes</Text>
          </Pressable>
          {view.lotCodes.map((code) => {
            const selected = kardexLot === code;
            return (
              <Pressable
                key={code}
                style={[styles.chip, selected ? styles.chipOn : styles.chipOff]}
                onPress={() => setKardexLot(code)}
              >
                <Text style={selected ? styles.chipOnText : styles.chipOffText}>Lote {code}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <FlatList
        data={view.lines}
        keyExtractor={(item) => item.id}
        refreshing={loading.status === 'loading'}
        onRefresh={() => activeStoreId && productId && onLoadKardex(activeStoreId, productId)}
        ListHeaderComponent={
          view.opening ? (
            <View style={styles.card}>
              <Text style={styles.name}>Saldo anterior</Text>
              <Text style={styles.meta}>
                Producto {view.opening.productBalance}
                {view.opening.lotBalance != null ? ` · Lote ${view.opening.lotBalance}` : ''}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading.status === 'loading' ? null : (
            <EmptyState title="Sin movimientos" description="Este producto aún no tiene kardex en el rango." />
          )
        }
        renderItem={({ item }) => <KardexRow line={item} />}
      />
    </View>
  );
}

function KardexRow({ line }: { line: KardexLine }) {
  const isIn = line.type === 'purchase';
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.name}>{isIn ? 'Compra' : 'Venta'}</Text>
          <Text style={styles.meta}>{formatDateTime(line.created_at)}</Text>
          <Text style={styles.meta}>{kardexDocumentLabel(line)}</Text>
          <Text style={styles.meta}>
            Lote {line.lot_code} · Vence {formatDate(line.expires_on)}
          </Text>
        </View>
        <View style={styles.qtyBox}>
          <Text style={[styles.qty, isIn ? styles.in : styles.out]}>
            {isIn ? `+${line.qty_in}` : `−${line.qty_out}`}
          </Text>
          <Text style={styles.balance}>Saldo {line.product_balance}</Text>
          <Text style={styles.meta}>Lote {line.lot_balance}</Text>
        </View>
      </View>
    </View>
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
  name: { fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textMuted },
  qtyBox: { alignItems: 'flex-end' },
  qty: { fontSize: fontSize.xl, fontWeight: '700' },
  in: { color: colors.brand },
  out: { color: colors.danger },
  balance: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
});
