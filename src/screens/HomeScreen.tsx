import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing } from '../utils/theme';
import { useAuthStore } from '../store/authStore';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const signOut = useAuthStore((state) => state.signOut);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>UradiSam AI 🛠️</Text>
      <Text style={styles.subtitle}>Dobrodošli u aplikaciju!</Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('Camera')}
      >
        <Text style={styles.buttonText}>Novi Popravak</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={signOut}>
        <Text style={styles.buttonText}>Odjavi se</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  button: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoutButton: {
    backgroundColor: colors.error,
    marginTop: spacing.xl,
    width: 'auto',
    paddingHorizontal: spacing.xl,
  },
  buttonText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
