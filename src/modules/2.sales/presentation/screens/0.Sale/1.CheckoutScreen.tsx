import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ButtonComponent, InputComponent, ScreenHeader } from '@/src/modules/_shared/components';
import { colors, fontSize, radius, space } from '@/src/modules/_shared/theme';
import { formatPen, parseMoneyInput, roundMoney } from '@/src/modules/_shared/utils';
import { useAuthStore } from '@/src/modules/0.auth/domain/usecases';
import { useCashRegisterStore } from '@/src/modules/3.cash-register/domain/usecases';
import { useSalesNavigation, useSalesStore } from '../../../domain/usecases';

type DraftPayment = { methodId: string; amount: string };

export function CheckoutScreen() {
  const profile = useAuthStore((state) => state.profile);
  const session = useCashRegisterStore((state) => state.session);
  const { cart, cartTotal, methods, onLoadMethods, onCheckout, loading, error, clearCart } = useSalesStore();
  const { goToSuccess, goToSale } = useSalesNavigation();
  const total = cartTotal();
  const [payments, setPayments] = useState<DraftPayment[]>([]);
  const [tendered, setTendered] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.organization_id) void onLoadMethods(profile.organization_id);
  }, [profile?.organization_id, onLoadMethods]);

  useEffect(() => {
    if (methods.length && payments.length === 0) {
      setPayments([{ methodId: methods[0].id, amount: String(total) }]);
    }
  }, [methods, payments.length, total]);

  const paid = roundMoney(payments.reduce((sum, row) => sum + parseMoneyInput(row.amount), 0));
  const remaining = roundMoney(total - paid);
  const cashMethod = methods.find((method) => method.code === 'cash');
  const cashAmount = payments
    .filter((row) => row.methodId === cashMethod?.id)
    .reduce((sum, row) => sum + parseMoneyInput(row.amount), 0);
  const change = cashMethod && parseMoneyInput(tendered) > cashAmount ? roundMoney(parseMoneyInput(tendered) - cashAmount) : 0;

  const selectedCodes = useMemo(() => new Set(payments.map((row) => row.methodId)), [payments]);

  const confirm = async () => {
    setLocalError(null);
    if (!profile?.store_id || !session) {
      setLocalError('Necesitas una caja abierta');
      return;
    }
    if (cart.length === 0) {
      setLocalError('El carrito está vacío');
      return;
    }
    if (Math.abs(remaining) > 0.009) {
      setLocalError('Los pagos deben cubrir el total exacto');
      return;
    }
    try {
      const saleId = await onCheckout(
        profile.store_id,
        session.id,
        payments
          .map((row) => ({ payment_method_id: row.methodId, amount: roundMoney(parseMoneyInput(row.amount)) }))
          .filter((row) => row.amount > 0),
      );
      goToSuccess(saleId);
    } catch {
      // error en el store
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="Cobro" subtitle={`Total ${formatPen(total)}`} />
      {cart.map((item) => (
        <View key={item.productId} style={styles.line}>
          <Text style={styles.lineText}>
            {item.quantity} × {item.name}
          </Text>
          <Text style={styles.strong}>{formatPen(item.unitPrice * item.quantity)}</Text>
        </View>
      ))}

      <Text style={styles.section}>Métodos de pago</Text>
      {payments.map((row, index) => {
        const method = methods.find((item) => item.id === row.methodId);
        return (
          <View key={`${row.methodId}-${index}`} style={styles.card}>
            <View style={styles.chips}>
              {methods.map((item) => {
                const selected = row.methodId === item.id;
                return (
                  <Pressable
                    key={item.id}
                    style={[styles.chip, selected ? styles.chipOn : styles.chipOff]}
                    onPress={() => {
                      const next = [...payments];
                      next[index] = { ...row, methodId: item.id };
                      setPayments(next);
                    }}
                  >
                    <Text style={selected ? styles.chipOnText : styles.chipOffText}>{item.name}</Text>
                  </Pressable>
                );
              })}
            </View>
            <InputComponent
              label={`Monto ${method?.name ?? ''}`}
              value={row.amount}
              keyboardType="decimal-pad"
              onChangeText={(amount) => {
                const next = [...payments];
                next[index] = { ...row, amount };
                setPayments(next);
              }}
            />
            {payments.length > 1 ? (
              <ButtonComponent
                variant="ghost"
                label="Quitar"
                onPress={() => setPayments(payments.filter((_, i) => i !== index))}
              />
            ) : null}
          </View>
        );
      })}

      {remaining > 0 ? (
        <ButtonComponent
          variant="secondary"
          label={`Agregar otro método (${formatPen(remaining)} restante)`}
          onPress={() => {
            const nextMethod = methods.find((method) => !selectedCodes.has(method.id)) ?? methods[0];
            if (nextMethod) setPayments([...payments, { methodId: nextMethod.id, amount: String(remaining) }]);
          }}
        />
      ) : null}

      {cashAmount > 0 ? (
        <View style={[styles.card, styles.cashCard]}>
          <InputComponent
            label="¿Con cuánto paga en efectivo?"
            value={tendered}
            keyboardType="decimal-pad"
            onChangeText={setTendered}
            placeholder={String(cashAmount)}
          />
          <Text style={styles.hint}>Vuelto: {formatPen(change)}</Text>
        </View>
      ) : null}

      <Text style={styles.hintTop}>
        Pagado {formatPen(paid)} · Resta {formatPen(Math.max(remaining, 0))}
      </Text>
      {localError || error ? <Text style={styles.error}>{localError || error}</Text> : null}

      <View style={styles.actions}>
        <ButtonComponent label="Confirmar venta" onPress={confirm} loading={loading.status === 'loading'} />
        <ButtonComponent variant="ghost" label="Volver" onPress={() => goToSale()} />
        <ButtonComponent variant="ghost" label="Vaciar carrito" onPress={clearCart} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingVertical: space.lg },
  line: {
    marginBottom: space.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  lineText: { color: colors.text },
  strong: { fontWeight: '600' },
  section: { marginBottom: space.sm, marginTop: space.lg, fontWeight: '600', color: colors.text },
  card: { marginBottom: space.md, borderRadius: radius.lg, backgroundColor: colors.card, padding: space.lg },
  cashCard: { marginTop: space.md },
  chips: { marginBottom: space.md, flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { borderRadius: radius.full, paddingHorizontal: space.md, paddingVertical: 4 },
  chipOn: { backgroundColor: colors.brand },
  chipOff: { backgroundColor: '#F1F5F9' },
  chipOnText: { color: colors.white },
  chipOffText: { color: '#334155' },
  hint: { marginTop: space.sm, fontSize: fontSize.sm, color: colors.textMuted },
  hintTop: { marginTop: space.lg, fontSize: fontSize.sm, color: colors.textMuted },
  error: { marginTop: space.sm, fontSize: fontSize.sm, color: colors.danger },
  actions: { marginTop: space.lg, gap: space.sm },
});
