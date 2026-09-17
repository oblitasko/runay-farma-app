import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, space } from '../theme';

type Props = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: Props) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: space.xl,
    paddingVertical: 40,
  },
  title: { textAlign: 'center', fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  description: { marginTop: space.sm, textAlign: 'center', fontSize: fontSize.sm, color: colors.textMuted },
});
