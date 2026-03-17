import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

const USER_NAME = 'Sophia';

function ChatBubble({ message, isUser }) {
  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
      <Text style={[styles.bubbleText, isUser ? styles.userText : styles.aiText]}>
        {message}
      </Text>
    </View>
  );
}

function ChatInput({ onSend }) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
    }
  };

  return (
    <View style={styles.inputContainer}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Digite sua mensagem..."
        placeholderTextColor="#BBBBBB"
        style={styles.input}
        multiline
        maxLength={500}
        returnKeyType="send"
        onSubmitEditing={handleSend}
      />
      <TouchableOpacity
        onPress={handleSend}
        style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
        disabled={!text.trim()}
      >
        <Text style={styles.sendIcon}>→</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AssistenteScreen() {
  const [messages, setMessages] = useState([]);
  const scrollViewRef = useRef(null);

  const handleSend = (text) => {
    const userMsg = { id: Date.now().toString(), text, isUser: true };
    setMessages((prev) => [...prev, userMsg]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.greeting}>Olá, {USER_NAME}</Text>
            <Text style={styles.greeting}>Como posso te ajudar?</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.messageList}
            contentContainerStyle={styles.messageContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg.text} isUser={msg.isUser} />
            ))}
          </ScrollView>
        )}

        <ChatInput onSend={handleSend} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F2EB',
  },
  flex: {
    flex: 1,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '300',
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 36,
  },

  // Messages
  messageList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messageContent: {
    paddingTop: 16,
    paddingBottom: 12,
  },

  // Bubble
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0292B7',
    borderTopRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  aiText: {
    color: '#1A1A1A',
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    paddingVertical: 0,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0292B7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});