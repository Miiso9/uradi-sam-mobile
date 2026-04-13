import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, Switch, View, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { ThemedCard } from '../components/ThemedCard';
import { spacing, borderRadius } from '../utils/theme';

interface MenuRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
  danger?: boolean;
}

const MenuRow: React.FC<MenuRowProps> = ({
  icon,
  label,
  right,
  onPress,
  isLast = false,
  danger = false,
}) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.menuRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View
        style={[
          styles.menuIconWrap,
          { backgroundColor: danger ? `${colors.error}15` : colors.surfaceRaised },
        ]}
      >
        <Ionicons name={icon} size={18} color={danger ? colors.error : colors.textSecondary} />
      </View>
      <ThemedText
        type="bodyMedium"
        style={[styles.menuLabel, { color: danger ? colors.error : colors.text }]}
      >
        {label}
      </ThemedText>
      <View style={styles.menuRight}>{right}</View>
    </TouchableOpacity>
  );
};

export default function ProfileScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const signOut = useAuthStore((state) => state.signOut);
  const user = useAuthStore((state) => state.user);

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    signOut();
  };

  const handleToggleTheme = () => {
    Haptics.selectionAsync();
    toggleTheme();
  };

  const userName = user?.email?.split('@')[0] || 'Korisnik';
  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <ThemedView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHero}>
          <View style={[styles.avatarRing, { borderColor: colors.primary }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryMuted }]}>
              <ThemedText
                type="title"
                style={{ color: colors.primary, fontSize: 24, fontWeight: '800' }}
              >
                {initials}
              </ThemedText>
            </View>
          </View>

          <ThemedText
            type="title"
            style={{ color: colors.text, marginTop: spacing.md, letterSpacing: -0.5 }}
          >
            {userName}
          </ThemedText>
          <ThemedText type="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>
            {user?.email}
          </ThemedText>

          <View
            style={[
              styles.planPill,
              { backgroundColor: colors.primaryMuted, borderColor: `${colors.primary}40` },
            ]}
          >
            <Ionicons name="star" size={12} color={colors.primary} />
            <ThemedText type="caption" style={{ color: colors.primary, fontWeight: '600' }}>
              Aktivni korisnik
            </ThemedText>
          </View>
        </View>

        <View style={styles.sectionLabel}>
          <ThemedText type="label" style={{ color: colors.textSecondary }}>
            Postavke
          </ThemedText>
        </View>

        <View style={styles.cardGroup}>
          <ThemedCard style={styles.menuCard} noPadding>
            <MenuRow
              icon="moon-outline"
              label="Tamni način rada"
              right={
                <Switch
                  value={theme === 'dark'}
                  onValueChange={handleToggleTheme}
                  trackColor={{ false: colors.borderStrong, true: `${colors.primary}60` }}
                  thumbColor={theme === 'dark' ? colors.primary : colors.textMuted}
                  ios_backgroundColor={colors.borderStrong}
                />
              }
            />
            <MenuRow
              icon="notifications-outline"
              label="Obavijesti"
              right={<Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
              onPress={() => {}}
            />
            <MenuRow
              icon="language-outline"
              label="Jezik aplikacije"
              right={
                <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                  HR / BS
                </ThemedText>
              }
              isLast
            />
          </ThemedCard>
        </View>

        <View style={styles.sectionLabel}>
          <ThemedText type="label" style={{ color: colors.textSecondary }}>
            Informacije
          </ThemedText>
        </View>

        <View style={styles.cardGroup}>
          <ThemedCard style={styles.menuCard} noPadding>
            <MenuRow
              icon="document-text-outline"
              label="Uvjeti korištenja"
              right={<Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
              onPress={() => {}}
            />
            <MenuRow
              icon="shield-outline"
              label="Politika privatnosti"
              right={<Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
              onPress={() => {}}
            />
            <MenuRow
              icon="information-circle-outline"
              label="O aplikaciji"
              right={
                <ThemedText type="caption" style={{ color: colors.textMuted }}>
                  v1.0.0
                </ThemedText>
              }
              isLast
            />
          </ThemedCard>
        </View>

        <View style={[styles.cardGroup, { marginTop: spacing.xs }]}>
          <ThemedCard style={styles.menuCard} noPadding>
            <MenuRow
              icon="log-out-outline"
              label="Odjavi se"
              onPress={handleSignOut}
              isLast
              danger
            />
          </ThemedCard>
        </View>

        <View style={styles.footer}>
          <ThemedText type="caption" style={{ color: colors.textMuted, textAlign: 'center' }}>
            UradiSam AI © 2025
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing['2xl'],
  },
  profileHero: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  avatarRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2.5,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  sectionLabel: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  cardGroup: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  menuCard: {
    padding: 0,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: spacing.sm,
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    flex: 1,
  },
  menuRight: {
    alignItems: 'flex-end',
  },
  footer: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
});
