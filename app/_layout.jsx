import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, usePathname } from 'expo-router';
import { useFonts, KoHo_400Regular, KoHo_500Medium, KoHo_600SemiBold, KoHo_700Bold, KoHo_300Light } from '@expo-google-fonts/koho';
import * as SplashScreen from 'expo-splash-screen';
import Header from '../components/Header';
import TabBar from '../components/TabBar';

SplashScreen.preventAutoHideAsync();

const BACK_ROUTES = ['/nova-leitura'];

export default function RootLayout() {
  const pathname = usePathname();
  const showBack = BACK_ROUTES.includes(pathname);

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
    <View style={styles.root}>
      <Header showBack={showBack} />
      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      </View>
      <TabBar />
    </View>
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
});