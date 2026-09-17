import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, space } from '@/src/modules/_shared/theme';
import { formatPen } from '@/src/modules/_shared/utils';
import type { CartItem } from '../../domain/entities';

type Props = {
  items: CartItem[];
  total: number;
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
  onCheckout: () => void;
};

export function CartPanel({ items, total, onIncrease, onDecrease, onCheckout }: Props) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Carrito</Text>
      {items.length === 0 ? (
        <Text style={styles.empty}>Agrega productos para cobrar.</Text>
      ) : (
        items.map((item) => (
          <View key={item.productId} style={styles.row}>
            <View style={styles.itemCopy}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>{formatPen(item.unitPrice)}</Text>
            </View>
            <View style={styles.stepper}>
              <Pressable style={styles.stepBtn} onPress={() => onDecrease(item.productId)}>
                <Text style={styles.stepLabel}>-</Text>
              </Pressable>
              <Text style={styles.qty}>{item.quantity}</Text>
              <Pressable style={[styles.stepBtn, styles.stepBtnPlus]} onPress={() => onIncrease(item.productId)}>
                <Text style={styles.stepPlus}>+</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
      <View style={styles.footer}>
        <Text style={styles.total}>{formatPen(total)}</Text>
        <Pressable
          style={[styles.checkout, items.length ? styles.checkoutOn : styles.checkoutOff]}
          disabled={!items.length}
          onPress={onCheckout}
        >
          <Text style={[styles.checkoutLabel, items.length ? styles.checkoutLabelOn : styles.checkoutLabelOff]}>
            Cobrar
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderRadius: radius.lg, backgroundColor: colors.card, padding: space.lg },
  title: { marginBottom: space.md, fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  empty: { fontSize: fontSize.sm, color: colors.textMuted },
  row: {
    marginBottom: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemCopy: { flex: 1, paddingRight: space.sm },
  itemName: { fontWeight: '500', color: colors.text },
  itemPrice: { fontSize: fontSize.xs, color: colors.textMuted },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  stepBtn: {
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: '#F1F5F9',
  },
  stepBtnPlus: { backgroundColor: colors.brandLight },
  stepLabel: { fontSize: fontSize.lg, color: colors.text },
  stepPlus: { fontSize: fontSize.lg, color: colors.brand },
  qty: { width: 24, textAlign: 'center', fontWeight: '600' },
  footer: { marginTop: space.sm, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: space.md },
  total: { marginBottom: space.md, textAlign: 'right', fontSize: fontSize.xl, fontWeight: '700', color: colors.brand },
  checkout: { alignItems: 'center', borderRadius: radius.md, paddingVertical: space.md },
  checkoutOn: { backgroundColor: colors.brand },
  checkoutOff: { backgroundColor: colors.border },
  checkoutLabel: { fontWeight: '600' },
  checkoutLabelOn: { color: colors.white },
  checkoutLabelOff: { color: colors.textMuted },
});
