import React, { useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  StatusBar,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { useTheme } from '../context/ThemeContext';
import { useProfileStore } from '../store/profileStore';
import { spacing, borderRadius, shadows } from '../utils/theme';

type HomeScreenNavigationProp = NavigationProp<{
  AIChatTab: undefined;
}>;

interface FadeInViewProps {
  children: React.ReactNode;
  delay: number;
  style?: StyleProp<ViewStyle>;
  direction?: 'up' | 'left' | 'right';
}

const FadeInView = ({ children, delay, style, direction = 'up' }: FadeInViewProps) => {
  const opacity = useSharedValue(0);
  const translate = useSharedValue(direction === 'up' ? 25 : direction === 'left' ? 25 : -25);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
    translate.value = withDelay(
      delay,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
  }, [delay, opacity, translate]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform:
      direction === 'up' ? [{ translateY: translate.value }] : [{ translateX: translate.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
};

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const { firstName, fetchProfile } = useProfileStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const displayName = firstName ? firstName : 'Majstore';

  const handleStartRepair = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('AIChatTab');
  };

  const quickCategories: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { icon: 'water-outline', label: 'Curenje vode' },
    { icon: 'flash-outline', label: 'Elektrika' },
    { icon: 'hammer-outline', label: 'Namještaj' },
    { icon: 'color-fill-outline', label: 'Zidovi' },
  ];

  return (
    <ThemedView style={{ flex: 1 }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
        translucent={false}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FadeInView delay={50} style={styles.header}>
          <View>
            <ThemedText
              type="label"
              style={{ color: colors.textSecondary, letterSpacing: 0.5, fontSize: 12 }}
            >
              SPREMAN ZA RAD?
            </ThemedText>
            <ThemedText
              type="title"
              style={{ color: colors.text, letterSpacing: -0.8, marginTop: 2, fontSize: 32 }}
            >
              Bok, {displayName}.
            </ThemedText>
          </View>
        </FadeInView>

        <FadeInView delay={150} style={styles.heroSection}>
          <TouchableOpacity
            style={[styles.heroCard, { backgroundColor: colors.primary }, shadows.amber]}
            onPress={handleStartRepair}
            activeOpacity={0.9}
          >
            <Ionicons
              name="scan-outline"
              size={180}
              color="rgba(255,255,255,0.07)"
              style={styles.heroBgIcon}
            />

            <View style={styles.heroTop}>
              <View style={styles.pulseBadge}>
                <View style={[styles.pulseDot, { backgroundColor: '#FFF' }]} />
                <ThemedText type="caption" style={{ color: '#FFF', fontWeight: '600' }}>
                  AI MAJSTOR JE SPREMAN
                </ThemedText>
              </View>
            </View>

            <View style={styles.heroBottom}>
              <ThemedText
                type="title"
                style={{ color: '#FFF', fontSize: 26, letterSpacing: -0.5, marginBottom: 8 }}
              >
                Novi popravak
              </ThemedText>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <ThemedText
                  type="bodyMedium"
                  style={{ color: 'rgba(255,255,255,0.85)', maxWidth: '75%', lineHeight: 20 }}
                >
                  Uslikaj kvar ili postavi pitanje. Pusti umjetnu inteligenciju da pronađe rješenje.
                </ThemedText>
                <View style={styles.actionArrowWrap}>
                  <Ionicons name="arrow-forward" size={24} color={colors.primary} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </FadeInView>

        <FadeInView delay={250} style={styles.section}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickScroll}
          >
            {quickCategories.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.quickChip,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={handleStartRepair}
                activeOpacity={0.7}
              >
                <Ionicons name={item.icon} size={18} color={colors.textSecondary} />
                <ThemedText type="bodyMedium" style={{ color: colors.text }}>
                  {item.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </FadeInView>

        <FadeInView delay={350} style={styles.section}>
          <ThemedText
            type="label"
            style={{
              color: colors.textSecondary,
              marginBottom: spacing.lg,
              paddingHorizontal: spacing.md,
            }}
          >
            KAKO OVO FUNKCIONIRA?
          </ThemedText>

          <View style={styles.timelineContainer}>
            <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />

            <View style={styles.timelineStep}>
              <View
                style={[
                  styles.timelineDot,
                  { backgroundColor: colors.primary, borderColor: colors.background },
                ]}
              />
              <View style={styles.timelineContent}>
                <ThemedText type="bodyMedium" style={{ color: colors.text }}>
                  1. Prepoznavanje
                </ThemedText>
                <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                  Uslikaj problematični dio ili jasno opiši kvar riječima.
                </ThemedText>
              </View>
            </View>

            <View style={styles.timelineStep}>
              <View
                style={[
                  styles.timelineDot,
                  { backgroundColor: colors.secondary, borderColor: colors.background },
                ]}
              />
              <View style={styles.timelineContent}>
                <ThemedText type="bodyMedium" style={{ color: colors.text }}>
                  2. AI Dijagnoza
                </ThemedText>
                <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                  Sustav analizira sliku i pretražuje bazu kako bi našao uzrok.
                </ThemedText>
              </View>
            </View>

            <View style={[styles.timelineStep, { marginBottom: 0 }]}>
              <View
                style={[
                  styles.timelineDot,
                  { backgroundColor: colors.success, borderColor: colors.background },
                ]}
              />
              <View style={styles.timelineContent}>
                <ThemedText type="bodyMedium" style={{ color: colors.text }}>
                  3. Rješenje i alati
                </ThemedText>
                <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                  Dobivaš upute korak-po-korak i popis potrebnog alata za popravak.
                </ThemedText>
              </View>
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={450} style={styles.section}>
          <View
            style={[
              styles.tipBanner,
              {
                backgroundColor: isDark ? '#2A2215' : '#FFF8E6',
                borderColor: isDark ? '#4A3B22' : '#FFE8B3',
              },
            ]}
          >
            <View style={[styles.tipIconWrap, { backgroundColor: colors.warning }]}>
              <Ionicons name="flash" size={16} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText
                type="label"
                style={{ color: isDark ? '#FCD34D' : '#D97706', marginBottom: 2 }}
              >
                ZLATNO PRAVILO
              </ThemedText>
              <ThemedText
                type="caption"
                style={{ color: isDark ? '#D1D5DB' : '#78350F', lineHeight: 18 }}
              >
                Uvijek zatvori glavni ventil ili isključi osigurač prije početka bilo kakvih radova
                na instalacijama!
              </ThemedText>
            </View>
          </View>
        </FadeInView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing['3xl'],
    paddingTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  heroSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  heroCard: {
    width: '100%',
    height: 220,
    borderRadius: 24,
    padding: spacing.xl,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  heroBgIcon: {
    position: 'absolute',
    right: -20,
    bottom: -30,
    transform: [{ rotate: '-15deg' }],
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  pulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroBottom: {
    marginTop: 'auto',
  },
  actionArrowWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  quickScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  timelineContainer: {
    paddingHorizontal: spacing.lg,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: spacing.lg + 7,
    top: 8,
    bottom: 24,
    width: 2,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    marginRight: spacing.md,
    marginTop: 2,
  },
  timelineContent: {
    flex: 1,
    gap: 2,
  },
  tipBanner: {
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  tipIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
