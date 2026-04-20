import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  View,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
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
  const { colors, theme, toggleTheme, isDark } = useTheme();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);

  const {
    firstName,
    lastName,
    avatarUrl,
    notificationsEnabled,
    loading,
    saving,
    fetchProfile,
    updateProfile,
    uploadAvatar,
    updateNotificationSettings,
    clearProfile,
  } = useProfileStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');

  useEffect(() => {
    if (user) fetchProfile();
  }, [user, fetchProfile]);

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearProfile();
    await signOut();
  };

  const handleToggleTheme = () => {
    Haptics.selectionAsync();
    toggleTheme();
  };

  const handleStartEdit = () => {
    Haptics.selectionAsync();
    setEditFirst(firstName);
    setEditLast(lastName);
    setIsEditingName(true);
  };

  const handleSaveEdit = async () => {
    try {
      await updateProfile(editFirst, editLast);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsEditingName(false);
    } catch (error) {
      Alert.alert('Greška', 'Nismo uspjeli spremiti podatke.');
      console.log(error);
    }
  };

  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert('Greška', 'Nije moguće učitati sliku.');
      console.log(error);
    }
  };

  const displayName = firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Novi Korisnik';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <ThemedView style={{ flex: 1 }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
        translucent={false}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHero}>
          <TouchableOpacity
            style={[styles.avatarRing, { borderColor: colors.primary }]}
            onPress={handlePickAvatar}
            activeOpacity={0.8}
            disabled={saving}
          >
            <View style={[styles.avatar, { backgroundColor: colors.primaryMuted }]}>
              {loading && !avatarUrl ? (
                <ActivityIndicator color={colors.primary} />
              ) : avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <ThemedText
                  type="title"
                  style={{ color: colors.primary, fontSize: 24, fontWeight: '800' }}
                >
                  {initials}
                </ThemedText>
              )}
            </View>
            <View style={[styles.editIconBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={14} color="#FFF" />
            </View>

            {saving && (
              <View style={styles.savingOverlay}>
                <ActivityIndicator color="#FFF" />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.nameContainer}>
            {isEditingName ? (
              <View style={styles.inlineEditWrap}>
                <View style={styles.inputsRow}>
                  <TextInput
                    style={[
                      styles.inlineInput,
                      { backgroundColor: colors.inputBg, color: colors.text },
                    ]}
                    value={editFirst}
                    onChangeText={setEditFirst}
                    placeholder="Ime"
                    placeholderTextColor={colors.textMuted}
                    autoFocus
                  />
                  <TextInput
                    style={[
                      styles.inlineInput,
                      { backgroundColor: colors.inputBg, color: colors.text },
                    ]}
                    value={editLast}
                    onChangeText={setEditLast}
                    placeholder="Prezime"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => setIsEditingName(false)}
                  >
                    <Ionicons name="close-circle" size={32} color={colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={handleSaveEdit}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator
                        size="small"
                        color={colors.primary}
                        style={{ marginHorizontal: 8 }}
                      />
                    ) : (
                      <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.nameDisplayRow}
                onPress={handleStartEdit}
                activeOpacity={0.7}
              >
                <ThemedText type="title" style={{ color: colors.text, letterSpacing: -0.5 }}>
                  {displayName}
                </ThemedText>
                <Ionicons
                  name="pencil"
                  size={20}
                  color={colors.textMuted}
                  style={styles.pencilIcon}
                />
              </TouchableOpacity>
            )}

            {!isEditingName && (
              <ThemedText type="caption" style={{ color: colors.textSecondary, marginTop: 4 }}>
                {user?.email}
              </ThemedText>
            )}
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
              right={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={(val) => {
                    Haptics.selectionAsync();
                    updateNotificationSettings(val);
                  }}
                  trackColor={{ false: colors.borderStrong, true: `${colors.primary}60` }}
                  thumbColor={notificationsEnabled ? colors.primary : colors.textMuted}
                />
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
            />
            <MenuRow
              icon="shield-outline"
              label="Politika privatnosti"
              right={<Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
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
            UradiSam AI © {new Date().getFullYear()}
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing['2xl'] },
  profileHero: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2.5,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  editIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
    minHeight: 60,
    justifyContent: 'center',
  },
  nameDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  pencilIcon: { marginLeft: 10, marginTop: 2 },
  inlineEditWrap: { alignItems: 'center', width: '100%' },
  inputsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  inlineInput: {
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    minWidth: 120,
    textAlign: 'center',
    fontWeight: '500',
  },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  actionBtn: { padding: 8 },
  sectionLabel: { paddingHorizontal: spacing.md, marginBottom: spacing.xs },
  cardGroup: { paddingHorizontal: spacing.md, marginBottom: spacing.md },
  menuCard: { padding: 0 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
    gap: spacing.sm,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: { flex: 1 },
  menuRight: { alignItems: 'flex-end' },
  footer: { paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
});
