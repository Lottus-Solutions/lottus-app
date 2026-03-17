import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';

const MOCK_CURRENT_BOOK = {
  title: 'Harry Potter e o Cálice de Fogo',
  genre: 'Fantasia',
  dueDays: 10,
};

const MOCK_PENDING_FEEDBACK = [
  {
    id: '1',
    title: 'Harry Potter e o Cálice de Fogo',
    genre: 'Fantasia',
    dueDays: 10,
  },
];

function CurrentBookCard({ title, genre, dueDays, onFinalize }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardGenre}>{genre}</Text>
          <Text style={styles.cardDue}>
            Devolução <Text style={styles.cardDueBold}>em {dueDays} dias</Text>
          </Text>
        </View>
        <TouchableOpacity onPress={onFinalize} style={styles.finalizeBtn} activeOpacity={0.8}>
          <Text style={styles.finalizeText}>Finalizar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PendingFeedbackCard({ title, genre, dueDays }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardGenre}>{genre}</Text>
      <Text style={styles.cardDue}>
        Devolução <Text style={styles.cardDueBold}>em {dueDays} dias</Text>
      </Text>
    </View>
  );
}

export default function LeiturasScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Livro atual */}
        <Text style={styles.sectionLabel}>Livro atual</Text>
        <CurrentBookCard
          title={MOCK_CURRENT_BOOK.title}
          genre={MOCK_CURRENT_BOOK.genre}
          dueDays={MOCK_CURRENT_BOOK.dueDays}
          onFinalize={() => {}}
        />

        {/* Nova leitura */}
        <TouchableOpacity
          onPress={() => router.push('/nova-leitura')}
          style={styles.novaLeituraBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.novaLeituraText}>+ Nova leitura</Text>
        </TouchableOpacity>

        {/* Sem feedback */}
        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Sem feedback</Text>
        {MOCK_PENDING_FEEDBACK.map((book) => (
          <PendingFeedbackCard key={book.id} {...book} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F2EB',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  content: {
    paddingTop: 16,
    paddingBottom: 32,
  },

  sectionLabel: {
    fontSize: 13,
    color: '#999999',
    marginBottom: 8,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  cardGenre: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  cardDue: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  cardDueBold: {
    fontWeight: '600',
    color: '#555555',
  },

  // Finalizar
  finalizeBtn: {
    backgroundColor: '#0292B7',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  finalizeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Nova leitura
  novaLeituraBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  novaLeituraText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0292B7',
  },
});