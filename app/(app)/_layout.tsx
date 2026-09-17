import { useEffect, useState } from 'react';
import { Tabs, Slot } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppDrawer, AppSidebar, AppTabBar } from '@/src/modules/_shared/components';
import { colors } from '@/src/modules/_shared/theme';
import { useBreakpoint } from '@/src/modules/_shared/utils';

export default function AppLayout() {
  const { isWide } = useBreakpoint();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (isWide) setDrawerOpen(false);
  }, [isWide]);

  if (isWide) {
    return (
      <SafeAreaView style={styles.wideSafe} edges={['top', 'left', 'bottom']}>
        <View style={styles.wideRow}>
          <AppSidebar />
          <SafeAreaView style={styles.contentSafe} edges={['top', 'right']}>
            <Slot />
          </SafeAreaView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.phoneSafe} edges={['top']}>
      <Tabs
        tabBar={(props) => (
          <AppTabBar
            state={props.state}
            navigation={props.navigation}
            onMenuPress={() => setDrawerOpen(true)}
            menuOpen={drawerOpen}
          />
        )}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="venta" options={{ title: 'Venta' }} />
        <Tabs.Screen name="inventario" options={{ title: 'Inventario' }} />
        <Tabs.Screen name="caja" options={{ title: 'Caja' }} />
        <Tabs.Screen name="historial" options={{ title: 'Historial' }} />
        <Tabs.Screen name="productos/index" options={{ href: null, title: 'Productos' }} />
        <Tabs.Screen name="kardex" options={{ href: null, title: 'Kardex' }} />
        <Tabs.Screen name="compras" options={{ href: null, title: 'Compras' }} />
        <Tabs.Screen name="reporte/index" options={{ href: null, title: 'Reporte' }} />
        <Tabs.Screen name="proveedores/index" options={{ href: null, title: 'Proveedores' }} />
        <Tabs.Screen name="vencimientos/index" options={{ href: null, title: 'Vencimientos' }} />
        <Tabs.Screen name="alertas/index" options={{ href: null, title: 'Alertas' }} />
        <Tabs.Screen name="estadisticas/index" options={{ href: null, title: 'Estadísticas' }} />
        <Tabs.Screen name="reposicion/index" options={{ href: null, title: 'Reposición' }} />
        <Tabs.Screen name="sucursales/index" options={{ href: null, title: 'Sucursales' }} />
        <Tabs.Screen name="factura" options={{ href: null, title: 'Comprobante' }} />
      </Tabs>
      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wideSafe: { flex: 1, backgroundColor: colors.brand },
  wideRow: { flex: 1, flexDirection: 'row', backgroundColor: colors.bg },
  contentSafe: { flex: 1, backgroundColor: colors.bg },
  phoneSafe: { flex: 1, backgroundColor: colors.bg },
});
