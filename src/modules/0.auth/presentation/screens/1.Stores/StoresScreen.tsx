import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ButtonComponent, EmptyState, InputComponent, ScreenHeader } from '@/src/modules/_shared/components';
import { colors, fontSize, radius, space } from '@/src/modules/_shared/theme';
import { useAuthStore } from '../../../domain/usecases';

export function StoresScreen() {
  const profile = useAuthStore((state) => state.profile);
  const stores = useAuthStore((state) => state.stores);
  const staff = useAuthStore((state) => state.staff);
  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  const onLoadStores = useAuthStore((state) => state.onLoadStores);
  const onCreateStore = useAuthStore((state) => state.onCreateStore);
  const onSetActiveStore = useAuthStore((state) => state.onSetActiveStore);
  const onLoadStaff = useAuthStore((state) => state.onLoadStaff);
  const onAssignStaffStore = useAuthStore((state) => state.onAssignStaffStore);
  const isOwner = profile?.role === 'owner';
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOwner) return;
    void onLoadStores();
    void onLoadStaff();
  }, [isOwner, onLoadStores, onLoadStaff]);

  const create = async () => {
    if (!name.trim()) {
      setFormError('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const store = await onCreateStore(name);
      setName('');
      await onSetActiveStore(store.id);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No se pudo crear el local');
    } finally {
      setSaving(false);
    }
  };

  if (!isOwner) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Sucursales" subtitle="Solo el dueño administra locales" />
        <EmptyState title="Sin acceso" description="El cajero trabaja en el local asignado a su perfil." />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Sucursales" subtitle="Elige el local activo para vender, caja e inventario" />
      <View style={styles.form}>
        <InputComponent label="Nuevo local" value={name} placeholder="Botica 2" onChangeText={setName} />
        {formError ? <Text style={styles.error}>{formError}</Text> : null}
        <ButtonComponent label="Crear local" onPress={create} loading={saving} />
      </View>
      <FlatList
        style={styles.list}
        data={stores}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState title="Sin locales" description="Crea el primer local." />}
        ListFooterComponent={
          staff.length ? (
            <View style={styles.staffBlock}>
              <Text style={styles.section}>Cajeros</Text>
              {staff.map((member) => (
                <View key={member.id} style={styles.staffCard}>
                  <Text style={styles.name}>{member.full_name}</Text>
                  <View style={styles.chips}>
                    {stores.map((store) => {
                      const selected = member.store_id === store.id;
                      return (
                        <Pressable
                          key={store.id}
                          style={[styles.chip, selected ? styles.chipOn : styles.chipOff]}
                          onPress={() => void onAssignStaffStore(member.id, store.id)}
                        >
                          <Text style={selected ? styles.chipOnText : styles.chipOffText}>{store.name}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const active = item.id === activeStoreId;
          return (
            <Pressable style={[styles.card, active && styles.cardActive]} onPress={() => void onSetActiveStore(item.id)}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{active ? 'Local activo' : 'Tocar para usar este local'}</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg, paddingTop: space.lg },
  form: { gap: space.sm, marginBottom: space.lg },
  error: { fontSize: fontSize.sm, color: colors.danger },
  list: { flex: 1 },
  card: {
    marginBottom: space.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderWidth: 1,
    borderColor: colors.card,
  },
  cardActive: { borderColor: colors.brand, backgroundColor: colors.brandLight },
  name: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textMuted },
  staffBlock: { marginTop: space.xl, paddingBottom: space.xxl },
  section: { marginBottom: space.md, fontWeight: '700', color: colors.text },
  staffCard: {
    marginBottom: space.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  chips: { marginTop: space.sm, flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { borderRadius: radius.full, paddingHorizontal: space.md, paddingVertical: 4 },
  chipOn: { backgroundColor: colors.brand },
  chipOff: { backgroundColor: '#F1F5F9' },
  chipOnText: { color: colors.white },
  chipOffText: { color: '#334155' },
});
