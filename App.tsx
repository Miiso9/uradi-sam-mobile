import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './src/services/supabase';
import { useAuthStore } from './src/store/authStore';
import HomeScreen from './src/screens/HomeScreen';
import AuthScreen from './src/screens/AuthScreen';
import CameraScreen from './src/screens/CameraScreen';
import { RootStackParamList } from './src/types';
import { colors } from './src/utils/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AnalysisPlaceholder = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);

export default function App() {
  const session = useAuthStore((state) => state.session);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [initializeAuth, setSession]);

  if (!isInitialized) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator id="RootStack" screenOptions={{ headerTintColor: colors.primary }}>
        {session && session.user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Moja Garaža' }} />
            <Stack.Screen
              name="Camera"
              component={CameraScreen}
              options={{ title: 'Slikaj Kvar' }}
            />
            <Stack.Screen
              name="AnalysisResult"
              component={AnalysisPlaceholder}
              options={{ title: 'AI Analiza' }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
