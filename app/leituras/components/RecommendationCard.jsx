import { BookMarked, BookX, Lightbulb } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const EMPTY_STATE_TITLE = 'Sem novos livros no momento';

export function isEmptyRecommendation(item) {
  return String(item?.titulo || '').trim().toLowerCase() === EMPTY_STATE_TITLE.toLowerCase();
}

export default function RecommendationCard({ item }) {
  if (isEmptyRecommendation(item)) {
    return (
      <View style={[styles.card, styles.emptyCard]}>
        <View style={styles.emptyIconWrap}>
          <BookX size={18} color="#9CA3AF" />
        </View>
        <Text style={styles.emptyText}>{item?.motivo}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <BookMarked size={18} color="#0292B7" />
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {item.titulo}
        </Text>
      </View>

      <View style={styles.motivoRow}>
        <Lightbulb size={14} color="#D9A441" />
        <Text style={styles.motivoText}>{item.motivo}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4F0F3',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6F4FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: 'KoHo_600SemiBold',
    fontSize: 15,
    color: '#1A1A1A',
  },
  motivoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingLeft: 42,
  },
  motivoText: {
    flex: 1,
    fontFamily: 'KoHo_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: '#6A6A6A',
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderStyle: 'dashed',
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    shadowOpacity: 0,
    elevation: 0,
  },
  emptyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    flex: 1,
    fontFamily: 'KoHo_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: '#999999',
  },
});
