
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider }    from 'react-native-safe-area-context';
import { StatusBar }           from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';

import AuthProvider, { useAuth } from './src/hooks/useAuth';
import { SessionProvider }       from './src/context/sessionContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';  // ← ADD
import AuthNavigator             from './src/navigation/authNavigator';
import MainNavigator             from './src/navigation/mainNavigator';

// ── Inner navigator — reads auth state ────────────────────────
function RootNavigator() {
  const { user, userData, loading } = useAuth();
  const { C, dark }                 = useTheme();   // ← live theme

  // Spinner while Firebase checks login
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.blue} />
      </View>
    );
  }

  return user ? (
    // Session context only needed when logged in
    <SessionProvider userId={user.uid} initialScore={userData?.score ?? 50}>
      {user
        ? <MainNavigator user={user} userData={userData} />
        : <AuthNavigator />
      }
    </SessionProvider>
  ) : (
    <AuthNavigator />
  );
}

// ── Root ────────────────────────────────────────────────────────
export default function App() {
  return (
    <SafeAreaProvider>
      {/* ThemeProvider MUST be here — outside NavigationContainer
          so every screen can call useTheme() and get live C */}
      <ThemeProvider initialDark={false}>
        {/* StatusBar reacts to dark mode automatically */}
        <ThemedStatusBar />

        <AuthProvider>
          {/* NavigationContainer at root level — not inside a child */}
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// ── StatusBar switches style with dark mode ────────────────────
// Separate component so it can call useTheme()
function ThemedStatusBar() {
  const { dark } = useTheme();
  return <StatusBar style={dark ? 'light' : 'dark'} />;
}