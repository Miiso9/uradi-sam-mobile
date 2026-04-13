import React from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ThemedTextProps extends TextProps {
  type?: 'title' | 'subtitle' | 'body' | 'bodyMedium' | 'caption' | 'button' | 'label';
  color?: string;
  style?: StyleProp<TextStyle>;
}

export const ThemedText: React.FC<ThemedTextProps> = ({
  type = 'body',
  color,
  style,
  children,
  ...props
}) => {
  const { colors } = useTheme();

  const baseStyles: Record<string, object> = {
    title: {
      fontSize: 28,
      fontWeight: '800',
      lineHeight: 36,
      letterSpacing: -0.6,
      color: color || colors.text,
    },
    subtitle: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
      letterSpacing: -0.2,
      color: color || colors.text,
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 26,
      color: color || colors.text,
    },
    bodyMedium: {
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 24,
      color: color || colors.text,
    },
    caption: {
      fontSize: 13,
      fontWeight: '400',
      lineHeight: 18,
      color: color || colors.textSecondary,
    },
    button: {
      fontSize: 16,
      fontWeight: '700',
      lineHeight: 24,
      letterSpacing: 0.2,
      color: color || colors.text,
    },
    label: {
      fontSize: 11,
      fontWeight: '700',
      lineHeight: 14,
      letterSpacing: 1.0,
      textTransform: 'uppercase',
      color: color || colors.textSecondary,
    },
  };

  return (
    <Text style={[baseStyles[type] || baseStyles.body, style]} {...props}>
      {children}
    </Text>
  );
};
