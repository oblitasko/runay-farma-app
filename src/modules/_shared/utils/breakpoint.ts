import { useWindowDimensions } from 'react-native';

export function useBreakpoint() {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  return {
    width,
    isPhone: !isWide,
    isWide,
    isDesktop: width >= 1024,
  };
}
