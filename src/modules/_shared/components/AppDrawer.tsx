import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, space } from '../theme';
import { AppNavMenu } from './AppNavMenu';

const PANEL_WIDTH = 280;

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AppDrawer({ open, onClose }: Props) {
  const [rendered, setRendered] = useState(open);
  const translateX = useRef(new Animated.Value(-PANEL_WIDTH)).current;
  const overlay = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) setRendered(true);
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: open ? 0 : -PANEL_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(overlay, {
        toValue: open ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished && !open) setRendered(false);
    });
  }, [open, overlay, translateX]);

  if (!rendered) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View style={[styles.overlay, { opacity: overlay }]} />
        </Pressable>
        <Animated.View style={[styles.panel, { transform: [{ translateX }] }]}>
          <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left']}>
            <AppNavMenu onNavigate={onClose} />
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { flex: 1, backgroundColor: colors.overlay },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: PANEL_WIDTH,
    backgroundColor: colors.brandDark,
  },
  safe: { flex: 1, paddingHorizontal: space.lg, paddingVertical: space.xl },
});
