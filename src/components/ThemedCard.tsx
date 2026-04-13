import React from 'react';
import { StyleProp, View, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ThemedCardProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
  accent?: boolean;
  elevated?: boolean;
  noPadding?: boolean;
}

export const ThemedCard: React.FC<ThemedCardProps> = ({
  style,
  children,
  accent = false,
  elevated = false,
  noPadding = false,
  ...props
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: elevated ? colors.surfaceRaised : colors.surface,
          borderRadius: 16,
          padding: noPadding ? 0 : 16,
          borderWidth: 1,
          borderColor: accent ? colors.primary : colors.border,
          borderLeftWidth: accent ? 3 : 1,
          shadowColor: colors.cardShadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 3,
          overflow: 'hidden',
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};
