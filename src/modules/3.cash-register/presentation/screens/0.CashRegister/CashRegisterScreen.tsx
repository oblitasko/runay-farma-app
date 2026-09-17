import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ButtonComponent, InputComponent, ScreenHeader } from '@/src/modules/_shared/components';
import { colors, fontSize, radius, space } from '@/src/modules/_shared/theme';
import { formatDateTime, formatPen, parseMoneyInput } from '@/src/modules/_shared/utils';
import { useAuthStore } from '@/src/modules/0.auth/domain/usecases';
import { useCashRegisterStore } from '../../../domain/usecases';

export function CashRegisterScreen() {
  const profile = useAuthStore((state) => state.profile);
  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  const storeName = useAuthStore((state) => state.stores.find((store) => store.id === state.activeStoreId)?.name);
  const { session, lastClosed, onLoadOpen, onOpen, onClose, loading, error } = useCashRegisterStore();
  const [opening, setOpening] = useState('0');
  const [counted, setCounted] = useState('');
  const [notes, setNotes] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (activeStoreId) void onLoadOpen(activeStoreId);
  }, [activeStoreId, onLoadOpen]);

  const openRegister = async () => {
    if (!profile?.organization_id || !activeStoreId) return;
    setLocalError(null);
    try {
      await onOpen({
        organizationId: profile.organization_id,
        storeId: activeStoreId,
        openedBy: profile.user_id,
        openingAmount: parseMoneyInput(opening),
      });
    } catch {
      // error en el store
    }
  };

  const closeRegister = async () => {
    setLocalError(null);
    if (counted.trim() === '') {
      setLocalError('Ingresa el efectivo contado');
      return;
    }
    try {
      await onClose(parseMoneyInput(counted), notes);
      setCounted('');
      setNotes('');
    } catch {
      // error en el store
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="Caja" subtitle={`${storeName ?? 'Local'} · ${session ? 'Turno abierto' : 'Sin turno'}`} />
      {error || localError ? <Text style={styles.error}>{localError || error}</Text> : null}

      {session ? (
        <View style={styles.card}>
          <Text style={styles.muted}>Abierta {formatDateTime(session.opened_at)}</Text>
          <Text style={styles.opening}>Fondo: {formatPen(Number(session.opening_amount))}</Text>
          <View style={styles.fields}>
            <InputComponent
              label="Efectivo contado al cierre"
              value={counted}
              onChangeText={setCounted}
              keyboardType="decimal-pad"
            />
            <InputComponent label="Notas (opcional)" value={notes} onChangeText={setNotes} />
            <ButtonComponent label="Cerrar caja" onPress={closeRegister} loading={loading.status === 'loading'} />
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <InputComponent
            label="Fondo inicial (efectivo)"
            value={opening}
            onChangeText={setOpening}
            keyboardType="decimal-pad"
          />
          <View style={styles.openAction}>
            <ButtonComponent label="Abrir caja" onPress={openRegister} loading={loading.status === 'loading'} />
          </View>
        </View>
      )}

      {lastClosed ? (
        <View style={[styles.card, styles.lastClosed]}>
          <Text style={styles.lastTitle}>Último cierre</Text>
          <Text style={styles.lastLine}>Esperado: {formatPen(Number(lastClosed.expected_cash ?? 0))}</Text>
          <Text style={styles.lastLine}>Contado: {formatPen(Number(lastClosed.closing_amount ?? 0))}</Text>
          <Text
            style={[
              styles.diff,
              Number(lastClosed.difference) === 0 ? styles.diffOk : styles.diffBad,
            ]}
          >
            Diferencia: {formatPen(Number(lastClosed.difference ?? 0))}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingVertical: space.lg },
  error: { marginBottom: space.md, fontSize: fontSize.sm, color: colors.danger },
  card: { borderRadius: radius.lg, backgroundColor: colors.card, padding: space.lg },
  muted: { fontSize: fontSize.sm, color: colors.textMuted },
  opening: { marginTop: space.sm, fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  fields: { marginTop: space.lg, gap: space.md },
  openAction: { marginTop: space.lg },
  lastClosed: { marginTop: space.lg },
  lastTitle: { fontWeight: '600', color: colors.text },
  lastLine: { marginTop: space.sm, fontSize: fontSize.sm, color: '#475569' },
  diff: { marginTop: 4, fontSize: fontSize.md, fontWeight: '700' },
  diffOk: { color: colors.brand },
  diffBad: { color: colors.danger },
});
