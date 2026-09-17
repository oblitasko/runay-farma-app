import { useEffect } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { ButtonComponent, EmptyState, ScreenHeader } from '@/src/modules/_shared/components';
import { colors, fontSize, radius, space } from '@/src/modules/_shared/theme';
import { formatDateTime } from '@/src/modules/_shared/utils';
import { useAuthStore } from '@/src/modules/0.auth/domain/usecases';
import { usePurchasesNavigation, usePurchasesStore } from '../../../domain/usecases';

export function PurchasesScreen() {
  const profile = useAuthStore((state) => state.profile);
  const isOwner = profile?.role === 'owner';
  const { items, onLoad, loading, error } = usePurchasesStore();
  const { goToReceive, goToSuppliers } = usePurchasesNavigation();

  useEffect(() => {
    if (profile?.store_id) void onLoad(profile.store_id);
  }, [profile?.store_id, onLoad]);

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Compras"
        subtitle="Ingreso de mercadería a lotes"
        right={<ButtonComponent label="Recibir" onPress={goToReceive} />}
      />
      {isOwner ? <ButtonComponent variant="secondary" label="Proveedores" onPress={goToSuppliers} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        style={styles.list}
        data={items}
        keyExtractor={(item) => item.id}
        refreshing={loading.status === 'loading'}
        onRefresh={() => profile?.store_id && onLoad(profile.store_id)}
        ListEmptyComponent={
          loading.status === 'loading' ? null : (
            <EmptyState title="Sin compras" description="Recibe mercadería para crear lotes y stock." />
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.supplier_name}</Text>
            <Text style={styles.meta}>
              {formatDateTime(item.received_at)} · {item.item_count} líneas
            </Text>
            {item.notes ? <Text style={styles.meta}>{item.notes}</Text> : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg, paddingTop: space.lg },
  error: { marginTop: space.md, fontSize: fontSize.sm, color: colors.danger },
  list: { marginTop: space.lg },
  card: {
    marginBottom: space.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  name: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textMuted },
});
