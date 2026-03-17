import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';

export default function VisaoGeralScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F2EB',
  },
  container: {
    flex: 1,
  },
});