import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { type PropsWithChildren } from 'react';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { AuthProvider } from '../context/AuthContext';
import { OfflineProvider } from '../context/OfflineContext';
import { PreferencesProvider } from '../context/PreferencesContext';
import { SnackbarProvider } from '../context/SnackbarContext';
import '../global.css';
import { suppressWebWarnings } from '../utils/debug-web-warnings';

function NavigationThemeBoundary({ children }: PropsWithChildren) {
  return (
    <ThemeProvider value={DefaultTheme}>
      <StatusBar style="dark" />
      {children}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  if (process.env.NODE_ENV === 'development') {
    suppressWebWarnings();
  }
  return (
    <PreferencesProvider>
      <AuthProvider>
        <OfflineProvider>
          <SnackbarProvider>
            <NavigationThemeBoundary>
              <Stack screenOptions={{ headerShown: false }} />
            </NavigationThemeBoundary>
          </SnackbarProvider>
        </OfflineProvider>
      </AuthProvider>
    </PreferencesProvider>
  );
}
