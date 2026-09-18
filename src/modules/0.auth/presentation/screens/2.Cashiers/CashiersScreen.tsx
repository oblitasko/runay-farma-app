import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { ButtonComponent, EmptyState, InputComponent, ScreenHeader } from '@/src/modules/_shared/components';
import { colors, fontSize, radius, space } from '@/src/modules/_shared/theme';
import { useAuthStore } from '../../../domain/usecases';

export function CashiersScreen() {
  const profile = useAuthStore((state) => state.profile);
  const stores = useAuthStore((state) => state.stores);
  const staff = useAuthStore((state) => state.staff);
  const onLoadStores = useAuthStore((state) => state.onLoadStores);
  const onLoadStaff = useAuthStore((state) => state.onLoadStaff);
  const onCreateCashier = useAuthStore((state) => state.onCreateCashier);
  const onAssignStaffStore = useAuthStore((state) => state.onAssignStaffStore);
  const onSetStaffActive = useAuthStore((state) => state.onSetStaffActive);
  const isOwner = profile?.role === 'owner';
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeId, setStoreId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOwner) return;
    void onLoadStores();
    void onLoadStaff();
  }, [isOwner, onLoadStores, onLoadStaff]);

  useEffect(() => {
    if (storeId || !stores.length) return;
    setStoreId(stores[0].id);
  }, [storeId, stores]);

  const create = async () => {
    if (!fullName.trim() || !email.trim() || !password || !storeId) {
      setFormError('Nombre, correo, contraseña y local son obligatorios');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await onCreateCashier({
        full_name: fullName,
        email,
        password,
        store_id: storeId,
      });
      setFullName('');
      setEmail('');
      setPassword('');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No se pudo crear el cajero');
    } finally {
      setSaving(false);
    }
  };

  if (!isOwner) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Cajeros" subtitle="Solo el dueño administra el personal" />
        <EmptyState title="Sin acceso" description="El cajero no gestiona usuarios." />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Cajeros" subtitle="Cuentas de tu organización: alta, local y activación" />
      <View style={styles.form}>
        <InputComponent label="Nombre" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
        <InputComponent
          label="Correo"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <InputComponent label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
        <Text style={styles.label}>Local</Text>
        <View style={styles.chips}>
          {stores.map((store) => {
            const selected = store.id === storeId;
            return (
              <Pressable
                key={store.id}
                style={[styles.chip, selected ? styles.chipOn : styles.chipOff]}
                onPress={() => setStoreId(store.id)}
              >
                <Text style={selected ? styles.chipOnText : styles.chipOffText}>{store.name}</Text>
              </Pressable>
            );
          })}
        </View>
        {formError ? <Text style={styles.error}>{formError}</Text> : null}
        <ButtonComponent label="Crear cajero" onPress={create} loading={saving} disabled={!stores.length} />
      </View>
      <FlatList
        style={styles.list}
        data={staff}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState title="Sin cajeros" description="Crea la primera cuenta de cajero." />}
        renderItem={({ item }) => {
          const storeName = stores.find((store) => store.id === item.store_id)?.name;
          return (
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <View style={styles.cardCopy}>
                  <Text style={styles.name}>{item.full_name}</Text>
                  <Text style={styles.meta}>{item.email ?? 'Sin correo'}</Text>
                  <Text style={styles.meta}>{storeName ?? 'Sin local'}</Text>
                </View>
                <View style={styles.active}>
                  <Text style={styles.activeLabel}>{item.is_active ? 'Activo' : 'Inactivo'}</Text>
                  <Switch
                    value={item.is_active}
                    onValueChange={(value) => void onSetStaffActive(item.id, value)}
                    trackColor={{ false: colors.border, true: colors.brandMuted }}
                    thumbColor={item.is_active ? colors.brand : colors.textSubtle}
                  />
                </View>
              </View>
              <View style={styles.chips}>
                {stores.map((store) => {
                  const selected = item.store_id === store.id;
                  return (
                    <Pressable
                      key={store.id}
                      style={[styles.chip, selected ? styles.chipOn : styles.chipOff]}
                      onPress={() => void onAssignStaffStore(item.id, store.id)}
                    >
                      <Text style={selected ? styles.chipOnText : styles.chipOffText}>{store.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg, paddingTop: space.lg },
  form: { gap: space.sm, marginBottom: space.lg },
  label: { fontSize: fontSize.sm, fontWeight: '500', color: colors.textMuted },
  error: { fontSize: fontSize.sm, color: colors.danger },
  list: { flex: 1 },
  card: {
    marginBottom: space.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  cardCopy: { flex: 1 },
  name: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textMuted },
  active: { alignItems: 'flex-end' },
  activeLabel: { marginBottom: space.xs, fontSize: fontSize.xs, color: colors.textMuted },
  chips: { marginTop: space.sm, flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { borderRadius: radius.full, paddingHorizontal: space.md, paddingVertical: 4 },
  chipOn: { backgroundColor: colors.brand },
  chipOff: { backgroundColor: '#F1F5F9' },
  chipOnText: { color: colors.white },
  chipOffText: { color: '#334155' },
});
