import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, globalStyles } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md }}>
      <Text style={styles.title}>Dobrodošli u Garažu 🛠️</Text>
      <Text style={styles.subtitle}>Tvoj osobni asistent za popravke je spreman.</Text>

      <View style={styles.card}>
        <Ionicons name="chatbubbles" size={40} color={colors.primary} />
        <Text style={styles.cardTitle}>Kako koristiti aplikaciju?</Text>
        <Text style={styles.cardText}>
          1. Prebaci se na tab "AI Majstor" na dnu ekrana.{'\n'}
          2. Uslikaj kvar ili odaberi sliku iz galerije.{'\n'}
          3. Napiši kratki opis (npr. "Zašto mi perilica curi?").{'\n'}
          4. AI će prepoznati problem, dati rješenje i ponuditi alate!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginTop: spacing.lg },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 16,
    ...globalStyles.shadow,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  cardText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    textAlign: 'left',
    width: '100%',
  },
});
