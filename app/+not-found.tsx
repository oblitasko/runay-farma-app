import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, space } from '@/src/modules/_shared/theme';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'No encontrada', headerShown: true }} />
      <View style={styles.screen}>
        <Text style={styles.title}>Pantalla no encontrada</Text>
        <Link href="/(app)/venta" style={styles.link}>
          Volver a venta
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    paddingHorizontal: space.xl,
  },
  title: { marginBottom: space.md, fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  link: { color: colors.brand },
});
