import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, globalStyles } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const signOut = useAuthStore((state) => state.signOut);
  const user = useAuthStore((state) => state.user);

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <Ionicons name="person-circle" size={80} color={colors.primary} />
        <Text style={styles.emailText}>{user?.email || 'Korisnik'}</Text>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <Ionicons name="log-out-outline" size={24} color={colors.error} />
          <Text style={styles.logoutText}>Odjavi se</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  profileHeader: { alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xl },
  emailText: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginTop: spacing.sm },
  menu: { backgroundColor: colors.surface, borderRadius: 12, ...globalStyles.shadow },
  logoutButton: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: colors.error, marginLeft: spacing.sm },
});
