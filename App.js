import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { SessionProvider } from './src/context/sessionContext';
import AuthNavigator from './src/navigation/authNavigator';
import MainNavigator from './src/navigation/mainNavigator';

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <SessionProvider userId={user?.uid} initialScore={user?.disciplineScore || 50}>
        <NavigationContainer>
          {user
            ? <MainNavigator user={user} onLogout={() => setUser(null)} />
            : <AuthNavigator onLogin={(userData) => setUser(userData)} />
          }
        </NavigationContainer>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
