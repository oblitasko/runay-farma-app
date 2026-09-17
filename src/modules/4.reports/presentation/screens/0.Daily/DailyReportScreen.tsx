import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ButtonComponent, EmptyState, InputComponent, ScreenHeader } from '@/src/modules/_shared/components';
import { colors, fontSize, radius, space } from '@/src/modules/_shared/theme';
import { formatPen, limaDateISO, openWhatsApp } from '@/src/modules/_shared/utils';
import { useAuthStore } from '@/src/modules/0.auth/domain/usecases';
import { useCashRegisterStore } from '@/src/modules/3.cash-register/domain/usecases';
import { useReportsStore } from '../../../domain/usecases';

export function DailyReportScreen() {
  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  const storeName = useAuthStore((state) => state.stores.find((store) => store.id === state.activeStoreId)?.name);
  const session = useCashRegisterStore((state) => state.session);
  const onLoadOpen = useCashRegisterStore((state) => state.onLoadOpen);
  const { report, dateISO, setDate, onLoad, loading, error } = useReportsStore();
  const [dateInput, setDateInput] = useState(dateISO || limaDateISO());
  const [shareError, setShareError] = useState<string | null>(null);

  useEffect(() => {
    if (activeStoreId) {
      void onLoad(activeStoreId, dateInput);
      void onLoadOpen(activeStoreId);
    }
  }, [activeStoreId, dateInput, onLoad, onLoadOpen]);

  const today = limaDateISO();
  const isToday = report?.dateISO === today;
  const includeOpening = Boolean(isToday && session && session.store_id === activeStoreId);
  const expectedCash = Number(report?.cashTotal ?? 0) + (includeOpening ? Number(session?.opening_amount ?? 0) : 0);

  const shareWhatsApp = async () => {
    if (!report) return;
    setShareError(null);
    const methods = report.byMethod.map((item) => `${item.name}: ${formatPen(item.amount)}`).join('\n');
    const text = `RUNAY FARMA — ${storeName ?? 'Local'}
Reporte ${report.dateISO}
Ventas: ${report.salesCount}
Total: ${formatPen(report.total)}
${methods}
${includeOpening ? `Efectivo esperado: ${formatPen(expectedCash)}` : `Efectivo de ventas: ${formatPen(report.cashTotal)}`}`;
    try {
      await openWhatsApp(undefined, text);
    } catch (err) {
      setShareError(err instanceof Error ? err.message : 'No se pudo abrir WhatsApp');
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="Reporte diario" subtitle={`${storeName ?? 'Local'} · hora de Lima`} />
      <InputComponent
        label="Fecha (YYYY-MM-DD)"
        value={dateInput}
        onChangeText={(value) => {
          setDateInput(value);
          setDate(value);
        }}
        placeholder={limaDateISO()}
      />
      <View style={styles.today}>
        <ButtonComponent
          variant="secondary"
          label="Hoy"
          onPress={() => {
            const next = limaDateISO();
            setDateInput(next);
            setDate(next);
            if (activeStoreId) void onLoad(activeStoreId, next);
          }}
        />
      </View>
      <View style={styles.actions}>
        <ButtonComponent variant="secondary" label="Estadísticas 7/30" onPress={() => router.push('/(app)/estadisticas' as never)} />
        {report ? <ButtonComponent variant="secondary" label="Enviar por WhatsApp" onPress={() => void shareWhatsApp()} /> : null}
      </View>
      {error || shareError ? <Text style={styles.error}>{shareError || error}</Text> : null}

      {loading.status === 'loading' && !report ? (
        <Text style={styles.loading}>Cargando reporte…</Text>
      ) : report && report.salesCount === 0 ? (
        <View style={styles.empty}>
          <EmptyState title="Sin ventas" description="No hay ventas registradas en esa fecha." />
        </View>
      ) : report ? (
        <View style={styles.stats}>
          <View style={styles.card}>
            <Text style={styles.statLabel}>Ventas</Text>
            <Text style={styles.statHero}>{report.salesCount}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.statLabel}>Total del día</Text>
            <Text style={[styles.statHero, styles.statBrand]}>{formatPen(report.total)}</Text>
          </View>
          {report.byMethod.map((method) => (
            <View key={method.code} style={styles.methodRow}>
              <Text style={styles.methodName}>{method.name}</Text>
              <Text style={styles.methodAmount}>{formatPen(method.amount)}</Text>
            </View>
          ))}
          <View style={styles.expected}>
            <Text style={styles.expectedLabel}>
              {includeOpening
                ? 'Efectivo esperado en caja (fondo de hoy + ventas en efectivo)'
                : 'Efectivo de ventas del día (sin fondo de otra fecha)'}
            </Text>
            <Text style={styles.expectedValue}>{formatPen(expectedCash)}</Text>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingVertical: space.lg },
  today: { marginTop: space.md },
  actions: { marginTop: space.md, gap: space.sm },
  error: { marginTop: space.md, fontSize: fontSize.sm, color: colors.danger },
  loading: { marginTop: space.xl, color: colors.textMuted },
  empty: { marginTop: space.xl },
  stats: { marginTop: space.xl, gap: space.md },
  card: { borderRadius: radius.lg, backgroundColor: colors.card, padding: space.lg },
  statLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  statHero: { fontSize: fontSize.hero, fontWeight: '700', color: colors.text },
  statBrand: { color: colors.brand },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  methodName: { color: '#1E293B' },
  methodAmount: { fontWeight: '600' },
  expected: { borderRadius: radius.lg, backgroundColor: colors.brandLight, padding: space.lg },
  expectedLabel: { fontSize: fontSize.sm, color: colors.brandDark },
  expectedValue: { marginTop: 4, fontSize: fontSize.xxl, fontWeight: '700', color: colors.brand },
});
