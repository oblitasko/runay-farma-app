import { Ionicons } from '@expo/vector-icons';
import { Tabs, Slot } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppSidebar } from '@/src/modules/_shared/components';
import { colors } from '@/src/modules/_shared/theme';
import { useBreakpoint } from '@/src/modules/_shared/utils';

export default function AppLayout() {
  const { isWide } = useBreakpoint();

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
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.textMuted,
        }}
      >
        <Tabs.Screen
          name="venta"
          options={{
            title: 'Venta',
            tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="productos"
          options={{
            title: 'Productos',
            tabBarIcon: ({ color, size }) => <Ionicons name="pricetag-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="inventario"
          options={{
            title: 'Inventario',
            tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="compras"
          options={{
            title: 'Compras',
            tabBarIcon: ({ color, size }) => <Ionicons name="archive-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="historial"
          options={{
            title: 'Historial',
            tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="caja"
          options={{
            title: 'Caja',
            tabBarIcon: ({ color, size }) => <Ionicons name="cash-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="reporte"
          options={{
            title: 'Reporte',
            tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen name="proveedores" options={{ href: null, title: 'Proveedores' }} />
        <Tabs.Screen name="vencimientos" options={{ href: null, title: 'Vencimientos' }} />
        <Tabs.Screen name="alertas" options={{ href: null, title: 'Alertas' }} />
        <Tabs.Screen name="estadisticas" options={{ href: null, title: 'Estadísticas' }} />
        <Tabs.Screen name="reposicion" options={{ href: null, title: 'Reposición' }} />
        <Tabs.Screen name="sucursales" options={{ href: null, title: 'Sucursales' }} />
        <Tabs.Screen name="factura" options={{ href: null, title: 'Comprobante' }} />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wideSafe: { flex: 1, backgroundColor: colors.brand },
  wideRow: { flex: 1, flexDirection: 'row', backgroundColor: colors.bg },
  contentSafe: { flex: 1, backgroundColor: colors.bg },
  phoneSafe: { flex: 1, backgroundColor: colors.bg },
});
