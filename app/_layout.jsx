import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, usePathname } from 'expo-router';
import Header from '../components/Header';
import TabBar from '../components/TabBar';

// Telas que usam botão de voltar no header em vez da logo
const BACK_ROUTES = ['/nova-leitura'];

export default function RootLayout() {
  const pathname = usePathname();
  const showBack = BACK_ROUTES.includes(pathname);

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