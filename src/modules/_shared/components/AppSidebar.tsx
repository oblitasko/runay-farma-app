import { StyleSheet, View } from 'react-native';
import { colors, space } from '../theme';
import { AppNavMenu } from './AppNavMenu';

export function AppSidebar() {
  return (
    <View style={styles.sidebar}>
      <AppNavMenu />
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
});
