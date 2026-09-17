import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '@/src/modules/0.auth/domain/usecases';
import { useInventoryStore } from '@/src/modules/7.inventory/domain/usecases';
import { APP_NAV_ITEMS, isNavItemActive } from '../navigation/appNav';
import { colors, fontSize, radius, space } from '../theme';

type Props = {
  onNavigate?: () => void;
};

export function AppNavMenu({ onNavigate }: Props) {
  const pathname = usePathname();
  const profile = useAuthStore((state) => state.profile);
  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  const stores = useAuthStore((state) => state.stores);
  const onSignOut = useAuthStore((state) => state.onSignOut);
  const alertCount = useInventoryStore((state) => state.alertCount);
  const onLoadStock = useInventoryStore((state) => state.onLoadStock);
  const storeName = stores.find((store) => store.id === activeStoreId)?.name;
  const isOwner = profile?.role === 'owner';

  useEffect(() => {
    if (profile?.organization_id && activeStoreId) {
      void onLoadStock(profile.organization_id, activeStoreId);
    }
  }, [profile?.organization_id, activeStoreId, onLoadStock]);

  const go = (href: string) => {
    router.push(href as never);
    onNavigate?.();
  };

  return (
    <View style={styles.root}>
      <Text style={styles.brand}>RUNAY FARMA</Text>
      <Text style={styles.user}>{profile?.full_name}</Text>
      {storeName ? (
        <Pressable
          onPress={() => {
            if (isOwner) go('/(app)/sucursales');
          }}
        >
          <Text style={styles.store}>{storeName}</Text>
        </Pressable>
      ) : (
        <View style={styles.storeSpacer} />
      )}
      <ScrollView style={styles.navScroll} contentContainerStyle={styles.navContent} showsVerticalScrollIndicator={false}>
        {APP_NAV_ITEMS.filter((item) => !item.ownerOnly || isOwner).map((item) => {
          const active = isNavItemActive(pathname, item);
          const showBadge = item.match === '/alertas' && alertCount > 0;
          return (
            <Pressable
              key={item.href}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => go(item.href)}
            >
              <Ionicons name={item.icon} size={20} color={colors.white} />
              <Text style={styles.navLabel}>{item.label}</Text>
              {showBadge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{alertCount > 99 ? '99+' : alertCount}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.footer}>
        <Text style={styles.role}>{isOwner ? 'Dueño' : 'Cajero'}</Text>
        <Pressable
          style={styles.navItem}
          onPress={() => {
            onNavigate?.();
            void onSignOut();
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.white} />
          <Text style={styles.navLabel}>Salir</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  brand: { paddingHorizontal: space.sm, fontSize: fontSize.xl, fontWeight: '700', color: colors.white },
  user: {
    paddingHorizontal: space.sm,
    fontSize: fontSize.sm,
    color: colors.brandMuted,
  },
  store: {
    marginBottom: space.lg,
    paddingHorizontal: space.sm,
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.white,
  },
  storeSpacer: { marginBottom: space.lg },
  navScroll: { flex: 1 },
  navContent: { paddingBottom: space.md },
  navItem: {
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
  navItemActive: { backgroundColor: colors.sidebarActive },
  navLabel: { flex: 1, fontSize: fontSize.md, fontWeight: '500', color: colors.white },
  badge: {
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.white,
    paddingHorizontal: 6,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.brand },
  footer: { paddingTop: space.sm },
  role: {
    marginBottom: space.sm,
    paddingHorizontal: space.sm,
    fontSize: fontSize.xs,
    color: colors.brandMuted,
  },
});
