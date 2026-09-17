import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '@/src/modules/0.auth/domain/usecases';
import { colors, fontSize, radius, space } from '../theme';

const items = [
  { href: '/(app)/venta', match: '/venta', label: 'Venta', icon: 'cart-outline' as const },
  { href: '/(app)/productos', match: '/productos', label: 'Productos', icon: 'pricetag-outline' as const },
  { href: '/(app)/historial', match: '/historial', label: 'Historial', icon: 'time-outline' as const },
  { href: '/(app)/caja', match: '/caja', label: 'Caja', icon: 'cash-outline' as const },
  { href: '/(app)/reporte', match: '/reporte', label: 'Reporte', icon: 'stats-chart-outline' as const },
];

export function AppSidebar() {
  const pathname = usePathname();
  const profile = useAuthStore((state) => state.profile);
  const onSignOut = useAuthStore((state) => state.onSignOut);

  return (
    <View style={styles.sidebar}>
      <Text style={styles.brand}>RUNAY FARMA</Text>
      <Text style={styles.user}>{profile?.full_name}</Text>
      {items.map((item) => {
        const active = pathname.startsWith(item.match);
        return (
          <Pressable
            key={item.href}
            style={[styles.navItem, active && styles.navItemActive]}
            onPress={() => router.push(item.href as never)}
          >
            <Ionicons name={item.icon} size={20} color={colors.white} />
            <Text style={styles.navLabel}>{item.label}</Text>
          </Pressable>
        );
      })}
      <View style={styles.spacer} />
      <Text style={styles.role}>{profile?.role === 'owner' ? 'Dueño' : 'Cajero'}</Text>
      <Pressable style={styles.navItem} onPress={() => void onSignOut()}>
        <Ionicons name="log-out-outline" size={20} color={colors.white} />
        <Text style={styles.navLabel}>Salir</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    height: '100%',
    width: 256,
    backgroundColor: colors.brand,
    paddingHorizontal: space.lg,
    paddingVertical: space.xl,
  },
  brand: { paddingHorizontal: space.sm, fontSize: fontSize.xl, fontWeight: '700', color: colors.white },
  user: {
    marginBottom: space.xxl,
    paddingHorizontal: space.sm,
    fontSize: fontSize.sm,
    color: colors.brandMuted,
  },
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
  navLabel: { fontSize: fontSize.md, fontWeight: '500', color: colors.white },
  spacer: { flex: 1 },
  role: {
    marginBottom: space.sm,
    paddingHorizontal: space.sm,
    fontSize: fontSize.xs,
    color: colors.brandMuted,
  },
});
