import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ChatBubble({ message }) {
  const isUser = message.role === 'user';
  const isAudio = message.type === 'audio';

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {isAudio ? (
          <Text style={[styles.audioText, isUser ? styles.userText : styles.aiText]}>
            Audio enviado
          </Text>
        ) : null}

        {!!message.text && (
          <Text style={[styles.text, isUser ? styles.userText : styles.aiText]}>
            {message.text}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 10,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  aiContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '84%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#0292B7',
    borderTopRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
  },
  text: {
    fontFamily: 'KoHo_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  audioText: {
    fontFamily: 'KoHo_600SemiBold',
    fontSize: 12,
    marginBottom: 6,
  },
  userText: {
    color: '#FFFFFF',
  },
  aiText: {
    color: '#1A1A1A',
  },
});
