import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { ThemedText } from './ThemedText';
import { ThemedCard } from './ThemedCard';
import { useTheme } from '../context/ThemeContext';

const messages = [
  'Analiziram problem...',
  'Pretražujem bazu rješenja...',
  'Generiram postupak...',
  'Provjeravam sigurnost...',
  'Dohvaćam alate...',
  'Skoro gotovo...',
];

const Dot: React.FC<{ index: number; color: string }> = ({ index, color }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    const delay = index * 140;
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 380, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 380, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(1, { duration: 380 }), withTiming(0.3, { duration: 380 })),
        -1,
        false,
      ),
    );
    return () => {
      cancelAnimation(translateY);
      cancelAnimation(opacity);
    };
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
};

export const AnimatedLoader: React.FC = () => {
  const { colors } = useTheme();
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ThemedCard style={styles.container}>
      <View style={styles.dotsRow}>
        {[0, 1, 2].map((i) => (
          <Dot key={i} index={i} color={colors.primary} />
        ))}
      </View>
      <ThemedText type="caption" style={[styles.message, { color: colors.textSecondary }]}>
        {messages[msgIndex]}
      </ThemedText>
    </ThemedCard>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    minWidth: 200,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    height: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  message: {
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
