import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ButtonComponent } from '@/src/modules/_shared/components';
import { colors, fontSize, radius, space } from '@/src/modules/_shared/theme';
import { useInvoicingNavigation } from '@/src/modules/8.invoicing/domain/usecases';
import { useSalesNavigation } from '../../../domain/usecases';

export function SaleSuccessScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { goToSale, goToDetail } = useSalesNavigation();
  const { goToInvoice } = useInvoicingNavigation();

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>OK</Text>
        </View>
        <Text style={styles.title}>Venta registrada</Text>
        <Text style={styles.subtitle}>
          {id ? `Comprobante interno ${id.slice(0, 8)}` : 'La venta se guardó correctamente'}
        </Text>
        <View style={styles.actions}>
          <ButtonComponent label="Nueva venta" onPress={goToSale} />
          {id ? <ButtonComponent variant="secondary" label="Emitir boleta" onPress={() => goToInvoice(id)} /> : null}
          {id ? <ButtonComponent variant="secondary" label="Ver detalle" onPress={() => goToDetail(id)} /> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, paddingHorizontal: space.xl },
  card: {
    width: '100%',
    maxWidth: 448,
    alignItems: 'center',
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    padding: space.xxl,
  },
  badge: {
    marginBottom: space.lg,
    height: 64,
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.brandLight,
  },
  badgeText: { fontSize: fontSize.xxl, color: colors.brand },
  title: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  subtitle: { marginTop: space.sm, textAlign: 'center', fontSize: fontSize.sm, color: colors.textMuted },
  actions: { marginTop: space.xl, width: '100%', gap: space.sm },
});
