import React, { useState, useEffect } from 'react';
import {
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  View,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { ThemedText } from '../components/ThemedText';
import { useTheme } from '../context/ThemeContext';
import { borderRadius, spacing, shadows } from '../utils/theme';

export default function AuthScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(-20);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(30);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
    logoTranslateY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) });
    formOpacity.value = withDelay(
      250,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }),
    );
    formTranslateY.value = withDelay(
      250,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslateY.value }],
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Greška', 'Molimo unesite email i lozinku.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    let error = null;
    if (isLoginMode) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      error = signInError;
    } else {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      error = signUpError;
      if (!error) Alert.alert('Uspjeh!', 'Provjerite email za potvrdu računa.');
    }
    setLoading(false);
    if (error) Alert.alert('Greška', error.message);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={[styles.accentBar, { backgroundColor: colors.primary }]} />

      <View style={styles.inner}>
        <Animated.View style={[styles.logoSection, logoStyle]}>
          <View
            style={[
              styles.iconRing,
              { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
            ]}
          >
            <Ionicons name="construct" size={40} color={colors.primary} />
          </View>
          <ThemedText type="title" style={[styles.appName, { color: colors.text }]}>
            UradiSam AI
          </ThemedText>
          <ThemedText type="caption" style={[styles.tagline, { color: colors.textSecondary }]}>
            Popravci postaju jednostavni
          </ThemedText>
        </Animated.View>

        <Animated.View
          style={[
            styles.formContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
            formStyle,
          ]}
        >
          <View
            style={[
              styles.modePill,
              { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.pillOption,
                isLoginMode && [styles.pillActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => {
                setIsLoginMode(true);
                Haptics.selectionAsync();
              }}
            >
              <ThemedText
                type="label"
                style={{
                  color: isLoginMode ? colors.background : colors.textSecondary,
                  letterSpacing: 0.5,
                }}
              >
                Prijava
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.pillOption,
                !isLoginMode && [styles.pillActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => {
                setIsLoginMode(false);
                Haptics.selectionAsync();
              }}
            >
              <ThemedText
                type="label"
                style={{
                  color: !isLoginMode ? colors.background : colors.textSecondary,
                  letterSpacing: 0.5,
                }}
              >
                Registracija
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.inputRow,
              {
                backgroundColor: colors.inputBg,
                borderColor: focusedField === 'email' ? colors.primary : colors.border,
              },
            ]}
          >
            <Ionicons
              name="mail-outline"
              size={18}
              color={focusedField === 'email' ? colors.primary : colors.textMuted}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Email adresa"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <View
            style={[
              styles.inputRow,
              {
                backgroundColor: colors.inputBg,
                borderColor: focusedField === 'password' ? colors.primary : colors.border,
              },
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={focusedField === 'password' ? colors.primary : colors.textMuted}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Lozinka"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: colors.primary },
              shadows.amber,
              loading && { opacity: 0.75 },
            ]}
            onPress={handleAuth}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <ThemedText type="button" style={{ color: colors.background }}>
                  {isLoginMode ? 'Prijavi se' : 'Registriraj se'}
                </ThemedText>
                <Ionicons name="arrow-forward" size={18} color={colors.background} />
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.footerNote, formStyle]}>
          <ThemedText type="caption" style={{ color: colors.textMuted, textAlign: 'center' }}>
            {isLoginMode ? 'Nemaš račun?' : 'Imaš račun?'}{' '}
            <ThemedText
              type="caption"
              style={{ color: colors.primary }}
              onPress={() => {
                setIsLoginMode(!isLoginMode);
                Haptics.selectionAsync();
              }}
            >
              {isLoginMode ? 'Registriraj se' : 'Prijavi se'}
            </ThemedText>
          </ThemedText>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  accentBar: {
    height: 3,
    width: '30%',
    marginTop: 0,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    marginBottom: spacing.xs,
    letterSpacing: -1,
  },
  tagline: {
    letterSpacing: 0.3,
  },
  formContainer: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modePill: {
    flexDirection: 'row',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    padding: 4,
    marginBottom: spacing.xs,
  },
  pillOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  pillActive: {
    ...shadows.amberSm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    height: '100%',
  },
  submitBtn: {
    height: 54,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  footerNote: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
});
