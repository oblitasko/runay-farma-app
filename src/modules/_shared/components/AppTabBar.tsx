import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_TAB_SHORTCUTS, isNavItemActive } from '../navigation/appNav';
import { colors, space } from '../theme';

type TabRoute = { key: string; name: string };

type Props = {
  state: { routes: TabRoute[] };
  navigation: {
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
  onMenuPress: () => void;
  menuOpen?: boolean;
};

function findTabRoute(routes: TabRoute[], name: string) {
  return routes.find((entry) => entry.name === name || entry.name === `${name}/index`);
}

export function AppTabBar({ state, navigation, onMenuPress, menuOpen = false }: Props) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
      {APP_TAB_SHORTCUTS.map((item) => {
        const route = findTabRoute(state.routes, item.name);
        const active = isNavItemActive(pathname, item);
        const color = active ? colors.brand : colors.textMuted;
        return (
          <Pressable
            key={item.name}
            style={styles.item}
            onPress={() => {
              if (route) {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (event.defaultPrevented) return;
                navigation.navigate(route.name);
                return;
              }
              router.push(item.href as never);
            }}
          >
            <Ionicons name={item.icon} size={22} color={color} />
            <Text style={[styles.label, { color }]} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
      <Pressable style={styles.item} onPress={onMenuPress}>
        <Ionicons name="menu-outline" size={22} color={menuOpen ? colors.brand : colors.textMuted} />
        <Text style={[styles.label, { color: menuOpen ? colors.brand : colors.textMuted }]}>Menú</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    paddingTop: space.sm,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontSize: 11, fontWeight: '600' },
});
