import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, View, ActivityIndicator } from 'react-native';

import AuthProvider, { useAuth } from './src/hooks/useAuth';
import { SessionProvider } from './src/context/sessionContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AuthNavigator from './src/navigation/authNavigator';
import MainNavigator from './src/navigation/mainNavigator';

function RootNavigator() {
  const { user, userData, loading } = useAuth();
  const { C } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.blue} />
      </View>
    );
  }

  return user ? (
    <MainNavigator user={user} userData={userData} />
  ) : (
    <AuthNavigator />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider initialDark={false}>
        <AuthProvider>
          {/*
            SessionProvider is now INSIDE AuthProvider.
            It reads userId from AuthContext internally — no prop needed.
            It will automatically re-subscribe to Firestore when auth resolves.
          */}
          <SessionProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </SessionProvider>
        </AuthProvider>
        <ThemedStatusBar />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedStatusBar() {
  const { dark } = useTheme();
  return <StatusBar style={dark ? 'light' : 'dark'} />;
}