import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState, InputComponent, ScreenHeader } from '@/src/modules/_shared/components';
import { colors, fontSize, radius, space } from '@/src/modules/_shared/theme';
import { formatPen, useBreakpoint } from '@/src/modules/_shared/utils';
import { useAuthStore } from '@/src/modules/0.auth/domain/usecases';
import { useProductsStore } from '@/src/modules/1.products/domain/usecases';
import { useCashRegisterStore } from '@/src/modules/3.cash-register/domain/usecases';
import { useInventoryStore } from '@/src/modules/7.inventory/domain/usecases';
import { useSalesNavigation, useSalesStore } from '../../../domain/usecases';
import { CartPanel } from '../../components';

export function SaleScreen() {
  const { isWide } = useBreakpoint();
  const { goToCheckout } = useSalesNavigation();
  const profile = useAuthStore((state) => state.profile);
  const { session, onLoadOpen } = useCashRegisterStore();
  const { items, search, setSearch, onLoad, loading } = useProductsStore();
  const { stock, onLoadStock } = useInventoryStore();
  const { cart, addToCart, setQuantity, cartTotal } = useSalesStore();
  const activeProducts = items.filter((item) => item.is_active);
  const stockById = Object.fromEntries(stock.map((row) => [row.productId, row]));

  useEffect(() => {
    if (profile?.organization_id) void onLoad(profile.organization_id);
    if (profile?.store_id) void onLoadOpen(profile.store_id);
  }, [profile?.organization_id, profile?.store_id, onLoad, onLoadOpen]);

  useFocusEffect(
    useCallback(() => {
      if (profile?.organization_id && profile.store_id) {
        void onLoadStock(profile.organization_id, profile.store_id);
      }
    }, [profile?.organization_id, profile?.store_id, onLoadStock]),
  );

  const cartView = (
    <CartPanel
      items={cart}
      total={cartTotal()}
      onIncrease={(id) => {
        const item = cart.find((row) => row.productId === id);
        const available = stockById[id]?.sellable ?? 0;
        if (item) setQuantity(id, Math.min(item.quantity + 1, available));
      }}
      onDecrease={(id) => {
        const item = cart.find((row) => row.productId === id);
        if (item) setQuantity(id, item.quantity - 1);
      }}
      onCheckout={goToCheckout}
    />
  );

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Venta rápida" subtitle={session ? 'Caja abierta' : 'Abre caja para cobrar'} />
      {!session ? (
        <View style={styles.warning}>
          <Text style={styles.warningText}>
            No hay caja abierta. Ve a Caja, ingresa el fondo y ábrela antes de vender.
          </Text>
        </View>
      ) : null}
      <InputComponent
        label="Buscar producto"
        value={search}
        placeholder="Nombre o código de barras"
        onChangeText={(value) => {
          setSearch(value);
          if (profile?.organization_id) void onLoad(profile.organization_id, value);
        }}
      />
      <View style={[styles.body, isWide && styles.bodyWide]}>
        <FlatList
          style={styles.list}
          data={activeProducts}
          keyExtractor={(item) => item.id}
          refreshing={loading.status === 'loading'}
          onRefresh={() => {
            if (profile?.organization_id) void onLoad(profile.organization_id);
            if (profile?.organization_id && profile.store_id) void onLoadStock(profile.organization_id, profile.store_id);
          }}
          ListEmptyComponent={<EmptyState title="Sin productos" description="Carga el catálogo para vender." />}
          renderItem={({ item }) => {
            const row = stockById[item.id];
            const sellable = row?.sellable ?? 0;
            const inCart = cart.find((line) => line.productId === item.id)?.quantity ?? 0;
            const canAdd = Boolean(session) && sellable > inCart;
            return (
              <Pressable style={styles.card} disabled={!canAdd} onPress={() => addToCart(item, sellable)}>
                <View style={styles.cardRow}>
                  <View style={styles.cardCopy}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardMeta}>
                      {item.barcode || item.sku || 'Sin código'} · Stock {sellable}
                    </Text>
                    {row?.isBelowMin ? <Text style={styles.alert}>Bajo mínimo</Text> : null}
                    {row?.hasExpiring30 ? <Text style={styles.warn}>Hay lote por vencer</Text> : null}
                    {sellable <= 0 ? <Text style={styles.alert}>Sin stock vendible</Text> : null}
                  </View>
                  <Text style={styles.cardPrice}>{formatPen(Number(item.sale_price))}</Text>
                </View>
              </Pressable>
            );
          }}
        />
        {isWide ? <View style={styles.cartWide}>{cartView}</View> : null}
      </View>
      {!isWide ? <View style={styles.cartPhone}>{cartView}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg, paddingTop: space.lg },
  warning: {
    marginBottom: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.warningBg,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  warningText: { fontSize: fontSize.sm, color: colors.warningText },
  body: { marginTop: space.lg, flex: 1 },
  bodyWide: { flexDirection: 'row', gap: space.lg },
  list: { flex: 1 },
  card: {
    marginBottom: space.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardCopy: { flex: 1, paddingRight: space.md },
  cardTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  cardMeta: { fontSize: fontSize.xs, color: colors.textMuted },
  alert: { fontSize: fontSize.xs, fontWeight: '600', color: colors.danger },
  warn: { fontSize: fontSize.xs, fontWeight: '600', color: colors.warningBody },
  cardPrice: { fontSize: fontSize.md, fontWeight: '700', color: colors.brand },
  cartWide: { width: 320 },
  cartPhone: { paddingVertical: space.md },
});
