import React from 'react';
import { StyleProp, View, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ThemedViewProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
}

export const ThemedView: React.FC<ThemedViewProps> = ({
  style,
  children,
  elevated = false,
  ...props
}) => {
  const { colors } = useTheme();
  return (
    <View
      style={[{ backgroundColor: elevated ? colors.backgroundElevated : colors.background }, style]}
      {...props}
    >
      {children}
    </View>
  );
};
