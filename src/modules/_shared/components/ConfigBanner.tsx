import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, space } from '../theme';

export function ConfigBanner() {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>Supabase no está configurado</Text>
      <Text style={styles.body}>
        Copia .env.example a .env y coloca EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginBottom: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.warningBg,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  title: { fontSize: fontSize.sm, fontWeight: '600', color: colors.warningText },
  body: { marginTop: space.xs, fontSize: fontSize.sm, color: colors.warningBody },
});
