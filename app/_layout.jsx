import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import {
  useFonts,
  KoHo_400Regular,
  KoHo_500Medium,
  KoHo_600SemiBold,
  KoHo_700Bold,
  KoHo_300Light,
} from '@expo-google-fonts/koho';
import * as SplashScreen from 'expo-splash-screen';

import Header from '../components/Header';
import TabBar from '../components/TabBar';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { DataSyncProvider } from '../src/context/DataSyncContext';

SplashScreen.preventAutoHideAsync();

const BACK_ROUTES = ['/nova-leitura', '/perfil'];
const AUTH_ROUTES = ['/login', '/cadastro'];
const PUBLIC_PATHS = new Set(['/login', '/cadastro', '/']); // permitidas sem auth

function ProtectedShell() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const { authenticated, bootstrapping } = useAuth();

  const showBack = BACK_ROUTES.includes(pathname);
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  // Redireciona quando muda o estado de auth ou rota.
  useEffect(() => {
    if (bootstrapping) return;
    const inAuthGroup = isAuthRoute || pathname === '/';
    if (!authenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (authenticated && (pathname === '/' || isAuthRoute)) {
      router.replace('/visao-geral');
    }
  }, [authenticated, bootstrapping, isAuthRoute, pathname, router, segments]);

  if (bootstrapping) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#0292B7" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {!isAuthRoute && authenticated && <Header showBack={showBack} />}
      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      </View>
      {!isAuthRoute && authenticated && <TabBar />}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    KoHo_300Light,
    KoHo_400Regular,
    KoHo_500Medium,
    KoHo_600SemiBold,
    KoHo_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <DataSyncProvider>
        <ProtectedShell />
      </DataSyncProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F2EB',
  },
  content: {
    flex: 1,
  },
  loading: {
    flex: 1,
    backgroundColor: '#F5F2EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
