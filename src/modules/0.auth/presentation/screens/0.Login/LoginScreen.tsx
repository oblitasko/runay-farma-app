import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { isSupabaseConfigured } from '@/src/lib/supabase';
import { ButtonComponent, ConfigBanner, InputComponent } from '@/src/modules/_shared/components';
import { colors, fontSize, radius, space } from '@/src/modules/_shared/theme';
import { useAuthStore } from '../../../domain/usecases';

export function LoginScreen() {
  const { onSignIn, onSignUp, loading, error, clearError } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const configured = isSupabaseConfigured();

  const submit = async () => {
    clearError();
    try {
      if (mode === 'login') {
        await onSignIn(email, password);
        return;
      }
      await onSignUp(email, password, fullName);
    } catch {
      // El error ya vive en el store.
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.hero}>
            <Image
              source={require('@/assets/icon.png')}
              style={styles.logo}
              accessibilityLabel="RUNAY"
            />
            <Text style={styles.title}>RUNAY FARMA</Text>
            <Text style={styles.subtitle}>Punto de venta para boticas</Text>
          </View>

          {!configured ? <ConfigBanner /> : null}

          {mode === 'register' ? (
            <View style={styles.field}>
              <InputComponent label="Nombre" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
            </View>
          ) : null}

          <View style={styles.field}>
            <InputComponent
              label="Correo"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <View style={styles.password}>
            <InputComponent label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <ButtonComponent
            label={mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            onPress={submit}
            loading={loading.status === 'loading'}
            disabled={!configured}
          />

          <ButtonComponent
            variant="ghost"
            label={mode === 'login' ? 'Crear una cuenta' : 'Ya tengo cuenta'}
            onPress={() => {
              clearError();
              setMode(mode === 'login' ? 'register' : 'login');
            }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: space.xl, paddingVertical: 40 },
  card: {
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    padding: space.xl,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  hero: { marginBottom: space.xl, alignItems: 'center' },
  logo: {
    marginBottom: space.md,
    height: 72,
    width: 72,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text },
  subtitle: { marginTop: space.xs, fontSize: fontSize.sm, color: colors.textMuted },
  field: { marginBottom: space.md },
  password: { marginBottom: space.lg },
  error: { marginBottom: space.md, fontSize: fontSize.sm, color: colors.danger },
});
