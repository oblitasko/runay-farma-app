import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <Image
              source={require('@/assets/splash-icon.png')}
              style={styles.logo}
              accessibilityLabel="RUNAY"
            />
            <Text style={styles.tagline}>GESTIÓN DE BOTICAS</Text>
          </View>

          <View style={styles.sheet}>
            <View style={styles.form}>
              <Text style={styles.modeTitle}>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</Text>

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

              <View style={styles.switchMode}>
                <ButtonComponent
                  variant="ghost"
                  label={mode === 'login' ? 'Crear una cuenta' : 'Ya tengo cuenta'}
                  onPress={() => {
                    clearError();
                    setMode(mode === 'login' ? 'register' : 'login');
                  }}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.brand },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  hero: {
    alignItems: 'center',
    paddingHorizontal: space.xl,
    paddingTop: space.xl,
    paddingBottom: space.xxl,
  },
  logo: { height: 120, width: 220 },
  brand: {
    marginTop: space.md,
    fontSize: fontSize.hero,
    fontWeight: '700',
    letterSpacing: 6,
    color: colors.white,
  },
  tagline: {
    marginTop: space.xs,
    fontSize: fontSize.sm,
    color: colors.white,
    opacity: 0.85,
  },
  sheet: {
    flexGrow: 1,
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: space.xl,
    paddingTop: space.xl,
    paddingBottom: space.xxl,
  },
  form: { width: '100%', maxWidth: 448, alignSelf: 'center' },
  modeTitle: {
    marginBottom: space.lg,
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  field: { marginBottom: space.md },
  password: { marginBottom: space.lg },
  error: { marginBottom: space.md, fontSize: fontSize.sm, color: colors.danger },
  switchMode: { marginTop: space.sm },
});
