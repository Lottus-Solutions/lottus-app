import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

const MOCK_GOALS = [
  { id: '1', title: 'Ler 4 livros', description: 'Quantidade de leitura', startDate: '10/03', progress: 0.25, progressColor: '#F5C842', progressTextColor: '#B7770D' },
  { id: '2', title: 'Ler um livro de Fantasia', description: 'Explorar nova categoria', startDate: '07/03', progress: 0.05, progressColor: '#F28B82', progressTextColor: '#C0392B' },
];

function GoalCard({ title, description, startDate, progress, progressColor, progressTextColor }) {
  const percent = Math.round(progress * 100);
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
          <Text style={styles.cardDate}>Início {startDate}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: progressColor + '33' }]}>
          <Text style={[styles.badgeText, { color: progressTextColor }]}>{percent}%</Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: progressColor }]} />
      </View>
    </View>
  );
}

export default function MetasScreen() {
  const [goals] = useState(MOCK_GOALS);
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.85}>
          <Text style={styles.addBtnText}>+ Adicionar meta</Text>
        </TouchableOpacity>
        <Text style={styles.sectionLabel}>Metas mensais</Text>
        {goals.map((goal) => <GoalCard key={goal.id} {...goal} />)}
        {goals.length === 0 && <Text style={styles.empty}>Nenhuma meta definida ainda.{'\n'}Crie sua primeira meta!</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F2EB' },
  scroll: { flex: 1, paddingHorizontal: 20 },
  content: { paddingTop: 16, paddingBottom: 32 },
  addBtn: { backgroundColor: '#0292B7', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 20 },
  addBtnText: { fontFamily: 'KoHo_600SemiBold', fontSize: 15, color: '#FFFFFF' },
  sectionLabel: { fontFamily: 'KoHo_500Medium', fontSize: 13, color: '#999999', marginBottom: 10 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { flex: 1, marginRight: 12 },
  cardTitle: { fontFamily: 'KoHo_600SemiBold', fontSize: 15, color: '#1A1A1A' },
  cardDescription: { fontFamily: 'KoHo_400Regular', fontSize: 12, color: '#999999', marginTop: 2 },
  cardDate: { fontFamily: 'KoHo_400Regular', fontSize: 12, color: '#999999', marginTop: 1 },
  badge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { fontFamily: 'KoHo_600SemiBold', fontSize: 12 },
  progressTrack: { marginTop: 12, height: 6, backgroundColor: '#F0EDE6', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  empty: { fontFamily: 'KoHo_400Regular', fontSize: 15, color: '#999999', textAlign: 'center', marginTop: 64, lineHeight: 24 },
});