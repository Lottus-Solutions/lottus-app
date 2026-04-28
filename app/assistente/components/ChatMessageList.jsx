import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import ChatBubble from './ChatBubble';
import TypingBubble from './TypingBubble';

export default function ChatMessageList({
  scrollViewRef,
  messages,
  isLoading,
  userName,
}) {
  if (!messages.length) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.greeting}>Ola, {userName}</Text>
        <Text style={styles.greeting}>Como posso te ajudar hoje?</Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.list}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {messages.map((message) => (
        <ChatBubble key={message.id} message={message} />
      ))}
      {isLoading ? <TypingBubble /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  greeting: {
    fontFamily: 'KoHo_300Light',
    fontSize: 26,
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 36,
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  content: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 12,
  },
});
