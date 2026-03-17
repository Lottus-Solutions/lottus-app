import { Funnel } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

const MOCK_BOOKS = [
  { id: '1', title: 'O Pequeno Príncipe', withdrawnDate: '12/02/2026', status: 'devolvido' },
  { id: '2', title: 'Dom Casmurro', withdrawnDate: '25/02/2026', status: 'atrasado' },
  { id: '3', title: 'A Revolução dos Bichos', withdrawnDate: '28/02/2026', status: 'proximoPrazo' },
];

const STATUS_CONFIG = {
  devolvido:    { label: 'Devolvido',     bg: '#D4EDDA', text: '#2E7D4F' },
  atrasado:     { label: 'Atrasado',      bg: '#FADBD8', text: '#C0392B' },
  proximoPrazo: { label: 'Próximo prazo', bg: '#FEF3CD', text: '#B7770D' },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.badgeText, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

function BookCard({ title, withdrawnDate, status }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.cardDate}>Retirado em {withdrawnDate}</Text>
      </View>
      <StatusBadge status={status} />
    </View>
  );
}

export default function HistoricoScreen() {
  const [books] = useState(MOCK_BOOKS);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterText}><Funnel size={12}/> Filtrar por</Text>
        </TouchableOpacity>
        {books.map((book) => (
          <BookCard key={book.id} title={book.title} withdrawnDate={book.withdrawnDate} status={book.status} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F2EB' },
  scroll: { flex: 1, paddingHorizontal: 20 },
  content: { paddingTop: 16, paddingBottom: 32 },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#0292B7',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  filterText: { fontFamily: 'KoHo_500Medium', fontSize: 13, color: '#0292B7', display: 'flex', alignItems: 'center', gap: 4 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInfo: { flex: 1, marginRight: 12 },
  cardTitle: { fontFamily: 'KoHo_600SemiBold', fontSize: 15, color: '#1A1A1A' },
  cardDate: { fontFamily: 'KoHo_400Regular', fontSize: 12, color: '#999999', marginTop: 2 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontFamily: 'KoHo_500Medium', fontSize: 11 },
});