import {
  BookOpen,
  Calendar,
  ClipboardList,
  Flag,
  SquareCheck,
  Target,
  TriangleAlert,
  Users,
} from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

function SectionHeader({ icon: Icon, title }) {
  return (
    <View style={styles.sectionHeader}>
      <Icon size={15} color="#0292B7" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function DisciplinaItem({ item }) {
  return (
    <View style={styles.disciplinaItem}>
      <Text style={styles.disciplinaTitle}>{item?.disciplina}</Text>

      {!!item?.desafio && (
        <View style={styles.detailRow}>
          <TriangleAlert size={13} color="#D97706" />
          <Text style={styles.detailText}>{item.desafio}</Text>
        </View>
      )}

      {!!item?.estrategia_leitura && (
        <View style={styles.detailRow}>
          <BookOpen size={13} color="#0292B7" />
          <Text style={styles.detailText}>{item.estrategia_leitura}</Text>
        </View>
      )}

      {!!item?.acao_semana && (
        <View style={styles.detailRow}>
          <SquareCheck size={13} color="#1F9D55" />
          <Text style={styles.detailText}>{item.acao_semana}</Text>
        </View>
      )}
    </View>
  );
}

function PlanoSemanalItem({ item, isLast }) {
  return (
    <View style={[styles.planoRow, isLast && styles.planoRowLast]}>
      <View style={styles.planoDiaWrap}>
        <Text style={styles.planoDia}>{item?.dia}</Text>
        {!!item?.tempo && <Text style={styles.planoTempo}>{item.tempo}</Text>}
      </View>
      <Text style={styles.planoLeitura}>{item?.leitura}</Text>
    </View>
  );
}

export default function BoletimResultCard({ data }) {
  const diagnostico = data?.diagnostico_geral;
  const disciplinas = Array.isArray(data?.disciplinas_prioritarias) ? data.disciplinas_prioritarias : [];
  const planoSemanal = Array.isArray(data?.plano_semanal_leitura) ? data.plano_semanal_leitura : [];
  const comoAjudar = Array.isArray(data?.como_pais_podem_ajudar) ? data.como_pais_podem_ajudar : [];
  const meta = data?.meta_30_dias;

  return (
    <View>
      <Text style={styles.title}>Análise do boletim</Text>

      {!!diagnostico && (
        <View style={styles.section}>
          <SectionHeader icon={ClipboardList} title="Diagnóstico geral" />
          <Text style={styles.bodyText}>{diagnostico}</Text>
        </View>
      )}

      {disciplinas.length > 0 && (
        <View style={styles.section}>
          <SectionHeader icon={Target} title="Disciplinas prioritárias" />
          {disciplinas.map((item, index) => (
            <DisciplinaItem key={`${item?.disciplina || 'disciplina'}-${index}`} item={item} />
          ))}
        </View>
      )}

      {planoSemanal.length > 0 && (
        <View style={styles.section}>
          <SectionHeader icon={Calendar} title="Plano semanal de leitura" />
          {planoSemanal.map((item, index) => (
            <PlanoSemanalItem
              key={`${item?.dia || 'dia'}-${index}`}
              item={item}
              isLast={index === planoSemanal.length - 1}
            />
          ))}
        </View>
      )}

      {comoAjudar.length > 0 && (
        <View style={styles.section}>
          <SectionHeader icon={Users} title="Como os pais podem ajudar" />
          {comoAjudar.map((item, index) => (
            <View key={index} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {!!meta && (
        <View style={styles.lastSection}>
          <SectionHeader icon={Flag} title="Meta de 30 dias" />
          <Text style={styles.bodyText}>{meta}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'KoHo_600SemiBold',
    fontSize: 15,
    color: '#1A1A1A',
    marginBottom: 10,
  },
  section: {
    marginBottom: 12,
  },
  lastSection: {
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: 'KoHo_600SemiBold',
    fontSize: 14,
    color: '#1A1A1A',
  },
  bodyText: {
    fontFamily: 'KoHo_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1A',
  },
  disciplinaItem: {
    marginTop: 6,
  },
  disciplinaTitle: {
    fontFamily: 'KoHo_600SemiBold',
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 3,
  },
  detailText: {
    flex: 1,
    fontFamily: 'KoHo_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#1A1A1A',
  },
  planoRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  planoRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  planoDiaWrap: {
    width: 78,
  },
  planoDia: {
    fontFamily: 'KoHo_600SemiBold',
    fontSize: 13,
    color: '#1A1A1A',
  },
  planoTempo: {
    marginTop: 2,
    fontFamily: 'KoHo_500Medium',
    fontSize: 11,
    color: '#0292B7',
  },
  planoLeitura: {
    flex: 1,
    fontFamily: 'KoHo_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#1A1A1A',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#0292B7',
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    fontFamily: 'KoHo_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1A',
  },
});
