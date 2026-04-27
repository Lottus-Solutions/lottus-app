import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { Funnel } from 'lucide-react-native';

import { useAuth } from '../../src/context/AuthContext';
import { useDataVersion } from '../../src/context/DataSyncContext';
import emprestimoService from '../../src/services/emprestimoService';
import { ApiError } from '../../src/api/client';

const STATUS_CONFIG = {
  ATIVO:       { label: 'Em leitura',   bg: '#E0F2F8', text: '#036C87' },
  FINALIZADO:  { label: 'Devolvido',    bg: '#D4EDDA', text: '#2E7D4F' },
  ATRASADO:    { label: 'Atrasado',     bg: '#FADBD8', text: '#C0392B' },
  ARQUIVADO:   { label: 'Arquivado',    bg: '#EFEFEF', text: '#777777' },
};

const FILTROS = [
  { value: null, label: 'Todos' },
  { value: 'ATIVO', label: 'Em leitura' },
  { value: 'FINALIZADO', label: 'Devolvidos' },
  { value: 'ATRASADO', label: 'Atrasados' },
];

function formatDate(iso) {
  if (!iso) return '-';
  // Espera "yyyy-MM-dd"
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, bg: '#EFEFEF', text: '#777777' };
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.badgeText, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

function BookCard({ emprestimo }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {emprestimo.livroTitulo}
        </Text>
        <Text style={styles.cardDate}>
          Retirado em {formatDate(emprestimo.dataEmprestimo)}
        </Text>
        {emprestimo.dataDevolucaoEfetiva && (
          <Text style={styles.cardDate}>
            Devolvido em {formatDate(emprestimo.dataDevolucaoEfetiva)}
          </Text>
        )}
      </View>
      <StatusBadge status={emprestimo.status} />
    </View>
  );
}

export default function HistoricoScreen() {
  const { matricula, authenticated } = useAuth();
  const versionEmprestimos = useDataVersion('emprestimos');
  const [emprestimos, setEmprestimos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!matricula) {
      setEmprestimos([]);
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const data = await emprestimoService.listEmprestimos(matricula);
      // Ordena por:
      // 1. Quem foi devolvido mais recentemente vem antes
      // 2. Sem dataDevolucaoEfetiva (em leitura) usa dataEmprestimo
      // 3. Empate -> id desc (insert mais recente)
      const sorted = (Array.isArray(data) ? data : []).slice().sort((a, b) => {
        const da = a.dataDevolucaoEfetiva || a.dataEmprestimo || '';
        const db = b.dataDevolucaoEfetiva || b.dataEmprestimo || '';
        if (da !== db) return db.localeCompare(da);
        return (b.id || 0) - (a.id || 0);
      });
      setEmprestimos(sorted);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Falha ao carregar histórico.';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [matricula]);

  useEffect(() => {
    if (!authenticated) return;
    setLoading(true);
    fetchData();
  }, [authenticated, fetchData, versionEmprestimos]);

  const filtered = useMemo(() => {
    if (!filtro) return emprestimos;
    return emprestimos.filter((e) => e.status === filtro);
  }, [emprestimos, filtro]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData();
            }}
            tintColor="#0292B7"
          />
        }
      >
        <TouchableOpacity
          style={styles.filterBtn}
          activeOpacity={0.8}
          onPress={() => setFilterOpen(true)}
        >
          <Funnel size={12} color="#0292B7" />
          <Text style={styles.filterText}>
            {filtro ? FILTROS.find((f) => f.value === filtro)?.label : 'Filtrar por'}
          </Text>
        </TouchableOpacity>

        {!matricula ? (
          <Text style={styles.empty}>Selecione um aluno para ver o histórico.</Text>
        ) : loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#0292B7" />
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>Nenhuma leitura encontrada.</Text>
        ) : (
          filtered.map((e) => <BookCard key={e.id} emprestimo={e} />)
        )}
      </ScrollView>

      <Modal
        transparent
        visible={filterOpen}
        animationType="fade"
        onRequestClose={() => setFilterOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFilterOpen(false)}>
          <Pressable style={styles.menuCard} onPress={() => {}}>
            <Text style={styles.menuTitle}>Filtrar por status</Text>
            {FILTROS.map((opt) => (
              <TouchableOpacity
                key={opt.value ?? 'todos'}
                style={[
                  styles.menuOption,
                  filtro === opt.value && styles.menuOptionActive,
                ]}
                onPress={() => {
                  setFiltro(opt.value);
                  setFilterOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.menuOptionText,
                    filtro === opt.value && styles.menuOptionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
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
    gap: 6,
  },
  filterText: { fontFamily: 'KoHo_500Medium', fontSize: 13, color: '#0292B7' },
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
  center: { paddingVertical: 32, alignItems: 'center' },
  empty: {
    fontFamily: 'KoHo_400Regular',
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
    paddingTop: 32,
  },
  errorText: {
    fontFamily: 'KoHo_500Medium',
    fontSize: 13,
    color: '#B43D35',
    textAlign: 'center',
    paddingTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E3D8',
  },
  menuTitle: {
    fontFamily: 'KoHo_700Bold',
    fontSize: 14,
    color: '#036C87',
    marginBottom: 10,
  },
  menuOption: { paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8 },
  menuOptionActive: { backgroundColor: '#E0F2F8' },
  menuOptionText: { fontFamily: 'KoHo_500Medium', fontSize: 14, color: '#1A1A1A' },
  menuOptionTextActive: { color: '#036C87', fontFamily: 'KoHo_600SemiBold' },
});
