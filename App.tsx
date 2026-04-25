import React, { useEffect } from 'react';
import { ActivityIndicator, View, Platform, StatusBar, LogBox } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import { supabase } from './src/services/supabase';
import { useAuthStore } from './src/store/authStore';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import HomeScreen from './src/screens/HomeScreen';
import AIChatScreen from './src/screens/AIChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AuthScreen from './src/screens/AuthScreen';
import { registerForPushNotificationsAsync } from './src/services/notifications';
import { useProfileStore } from './src/store/profileStore';
import 'react-native-reanimated';

LogBox.ignoreLogs([
  'expo-notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
  'Android Push notifications (remote notifications) functionality',
]);

enableScreens();

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      id="MainTabs"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'AIChatTab') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginTop: 2,
        },
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : Platform.OS === 'ios' ? 16 : 8,
          paddingTop: 8,
          backgroundColor: colors.tabBar,
          borderTopWidth: 1,
          borderTopColor: colors.tabBarBorder,
          elevation: 0,
        },
        tabBarHideOnKeyboard: true,
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTitleStyle: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '700',
          letterSpacing: -0.3,
        },
        headerShadowVisible: false,
        headerTintColor: colors.primary,
        tabBarItemStyle: {
          borderTopWidth: 2,
          borderTopColor: 'transparent',
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: 'Početna', tabBarLabel: 'Početna', headerTitle: 'UradiSam' }}
      />
      <Tab.Screen
        name="AIChatTab"
        component={AIChatScreen}
        options={{
          title: 'AI Majstor',
          tabBarLabel: 'AI Majstor',
          headerTitle: 'AI Majstor',
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Profil', tabBarLabel: 'Profil', headerTitle: 'Moj Profil' }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const session = useAuthStore((state) => state.session);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const setSession = useAuthStore((state) => state.setSession);
  const { colors, isDark } = useTheme();
  const savePushToken = useProfileStore((state) => state.savePushToken);

  useEffect(() => {
    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession);
        if (currentSession?.user) {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            savePushToken(token);
          }
        }
      },
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [initializeAuth, setSession, savePushToken]);

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

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
      notification: colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <Stack.Navigator id="RootStack" screenOptions={{ headerShown: false }}>
        {session && session.user ? (
          <Stack.Screen name="MainTabs" component={MainTabs} />
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
