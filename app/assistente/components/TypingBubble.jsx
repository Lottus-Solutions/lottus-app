import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function TypingBubble() {
  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <ActivityIndicator size="small" color="#0292B7" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bubble: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
