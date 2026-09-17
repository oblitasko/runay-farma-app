import type { Ionicons } from '@expo/vector-icons';

export type AppNavItem = {
  name: string;
  href: string;
  match: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  ownerOnly?: boolean;
  shortcut?: boolean;
};

export const APP_NAV_ITEMS: AppNavItem[] = [
  { name: 'venta', href: '/(app)/venta', match: '/venta', label: 'Venta', icon: 'cart-outline', shortcut: true },
  { name: 'productos', href: '/(app)/productos', match: '/productos', label: 'Productos', icon: 'pricetag-outline' },
  { name: 'inventario', href: '/(app)/inventario', match: '/inventario', label: 'Inventario', icon: 'cube-outline', shortcut: true },
  { name: 'alertas', href: '/(app)/alertas', match: '/alertas', label: 'Alertas', icon: 'notifications-outline' },
  { name: 'compras', href: '/(app)/compras', match: '/compras', label: 'Compras', icon: 'archive-outline' },
  { name: 'proveedores', href: '/(app)/proveedores', match: '/proveedores', label: 'Proveedores', icon: 'business-outline' },
  {
    name: 'reposicion',
    href: '/(app)/reposicion',
    match: '/reposicion',
    label: 'Reposición',
    icon: 'reload-outline',
    ownerOnly: true,
  },
  { name: 'historial', href: '/(app)/historial', match: '/historial', label: 'Historial', icon: 'time-outline', shortcut: true },
  { name: 'caja', href: '/(app)/caja', match: '/caja', label: 'Caja', icon: 'cash-outline', shortcut: true },
  { name: 'reporte', href: '/(app)/reporte', match: '/reporte', label: 'Reporte', icon: 'calendar-outline' },
  { name: 'estadisticas', href: '/(app)/estadisticas', match: '/estadisticas', label: 'Estadísticas', icon: 'stats-chart-outline' },
  {
    name: 'sucursales',
    href: '/(app)/sucursales',
    match: '/sucursales',
    label: 'Sucursales',
    icon: 'storefront-outline',
    ownerOnly: true,
  },
];

export const APP_TAB_SHORTCUTS = ['venta', 'inventario', 'caja', 'historial']
  .map((name) => APP_NAV_ITEMS.find((item) => item.name === name))
  .filter((item): item is AppNavItem => Boolean(item));

export function isNavItemActive(pathname: string, item: AppNavItem) {
  return pathname.startsWith(item.match);
}
