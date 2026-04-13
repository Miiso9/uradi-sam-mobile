import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, StatusBar } from 'react-native';
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
import { ThemedCard } from '../components/ThemedCard';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { spacing, borderRadius, shadows } from '../utils/theme';

type HomeScreenNavigationProp = NavigationProp<{
  AIChatTab: undefined;
}>;

interface ActionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
  delay: number;
}

const ActionCard: React.FC<ActionCardProps> = ({
  icon,
  title,
  subtitle,
  color,
  onPress,
  delay,
}) => {
  const { colors } = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }),
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
  }, [delay, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.actionCardWrap, style]}>
      <TouchableOpacity
        style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        activeOpacity={0.8}
      >
        <View style={[styles.actionIconBg, { backgroundColor: `${color}18` }]}>
          <Ionicons name={icon} size={26} color={color} />
        </View>
        <ThemedText type="bodyMedium" style={{ color: colors.text, marginBottom: 2 }}>
          {title}
        </ThemedText>
        <ThemedText type="caption" style={{ color: colors.textSecondary }}>
          {subtitle}
        </ThemedText>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  color: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, text, color }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIconDot, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <ThemedText type="caption" style={{ flex: 1, color: colors.textSecondary, lineHeight: 20 }}>
        {text}
      </ThemedText>
    </View>
  );
};

interface HowStep {
  step: string;
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((state) => state.user);
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const headerOpacity = useSharedValue(0);
  const headerTranslate = useSharedValue(-10);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) });
    headerTranslate.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
  }, [headerOpacity, headerTranslate]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslate.value }],
  }));

  const userName = user?.email?.split('@')[0] || 'Korisnik';

  const actions: ActionCardProps[] = [
    {
      icon: 'camera',
      title: 'Uslikaj kvar',
      subtitle: 'AI prepoznaje problem',
      color: colors.primary,
      onPress: () => navigation.navigate('AIChatTab'),
      delay: 0,
    },
    {
      icon: 'chatbubbles',
      title: 'Postavi pitanje',
      subtitle: 'Opiši problem riječima',
      color: colors.secondary,
      onPress: () => navigation.navigate('AIChatTab'),
      delay: 80,
    },
    {
      icon: 'construct',
      title: 'Korak-po-korak',
      subtitle: 'Detaljne upute',
      color: '#A78BFA',
      onPress: () => navigation.navigate('AIChatTab'),
      delay: 160,
    },
    {
      icon: 'shield-checkmark',
      title: 'Sigurnosni savjeti',
      subtitle: 'Upozorenja i mjere',
      color: colors.success,
      onPress: () => navigation.navigate('AIChatTab'),
      delay: 240,
    },
  ];

  const howSteps: HowStep[] = [
    { step: '01', text: 'Uslikaj kvar ili opiši problem', icon: 'camera-outline' },
    { step: '02', text: 'AI analizira i identificira uzrok', icon: 'analytics-outline' },
    { step: '03', text: 'Dobivaš korak-po-korak upute', icon: 'list-outline' },
  ];

  return (
    <ThemedView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.header, headerStyle]}>
          <View>
            <ThemedText type="label" style={{ color: colors.primary, marginBottom: 4 }}>
              Dobro došao
            </ThemedText>
            <ThemedText type="title" style={{ color: colors.text, letterSpacing: -1 }}>
              {userName} 👋
            </ThemedText>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: colors.primaryMuted, borderColor: `${colors.primary}40` },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
            <ThemedText type="caption" style={{ color: colors.primary }}>
              AI spreman
            </ThemedText>
          </View>
        </Animated.View>

        <Animated.View
          style={[{ paddingHorizontal: spacing.md, marginBottom: spacing.lg }, headerStyle]}
        >
          <TouchableOpacity
            style={[styles.heroCta, { backgroundColor: colors.primary }, shadows.amber]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate('AIChatTab');
            }}
            activeOpacity={0.88}
          >
            <View style={styles.heroCtaLeft}>
              <Ionicons name="scan" size={28} color={colors.background} />
              <View>
                <ThemedText type="button" style={{ color: colors.background, fontSize: 17 }}>
                  Analiziraj problem
                </ThemedText>
                <ThemedText type="caption" style={{ color: `${colors.background}AA` }}>
                  Uslikaj ili opiši kvar
                </ThemedText>
              </View>
            </View>
            <Ionicons name="arrow-forward-circle" size={28} color={`${colors.background}CC`} />
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.sectionHeader}>
          <ThemedText type="label" style={{ color: colors.textSecondary }}>
            Mogućnosti
          </ThemedText>
        </View>

        <View style={styles.grid}>
          {actions.map((item, idx) => (
            <ActionCard key={idx} {...item} />
          ))}
        </View>

        <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.md }}>
          <ThemedCard accent style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Ionicons name="bulb" size={20} color={colors.primary} />
              <ThemedText type="label" style={{ color: colors.primary }}>
                Savjet dana
              </ThemedText>
            </View>
            <ThemedText type="body" style={{ color: colors.text, marginBottom: spacing.md }}>
              Osnovna pravila sigurnog popravka:
            </ThemedText>
            <View style={styles.infoList}>
              <InfoRow
                icon="flash-off"
                text="Isključi struju prije rada na elektro instalacijama"
                color={colors.warning}
              />
              <InfoRow
                icon="water"
                text="Zatvori vodu prije rada na vodoinstalacijama"
                color={colors.secondary}
              />
              <InfoRow
                icon="eye"
                text="Koristi zaštitne naočale i rukavice"
                color={colors.success}
              />
            </View>
          </ThemedCard>
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText type="label" style={{ color: colors.textSecondary }}>
            Kako to radi
          </ThemedText>
        </View>

        <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.xl }}>
          <ThemedCard style={styles.howCard}>
            {howSteps.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.howRow,
                  idx < howSteps.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View style={[styles.stepNum, { borderColor: colors.borderStrong }]}>
                  <ThemedText type="label" style={{ color: colors.primary, fontSize: 10 }}>
                    {item.step}
                  </ThemedText>
                </View>
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={colors.textSecondary}
                  style={{ marginRight: 4 }}
                />
                <ThemedText type="body" style={{ flex: 1, color: colors.text, fontSize: 15 }}>
                  {item.text}
                </ThemedText>
              </View>
            ))}
          </ThemedCard>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  heroCtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionCardWrap: {
    width: '50%',
    padding: spacing.xs,
  },
  actionCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.sm,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  tipCard: {
    padding: spacing.md,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  infoList: {
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  infoIconDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  howCard: { padding: 0, overflow: 'hidden' },
  howRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
