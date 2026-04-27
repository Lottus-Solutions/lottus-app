import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, GraduationCap } from 'lucide-react-native';

import { useAuth } from '../../src/context/AuthContext';
import { useDataVersion } from '../../src/context/DataSyncContext';
import usuarioService from '../../src/services/usuarioService';
import emprestimoService from '../../src/services/emprestimoService';
import { ApiError } from '../../src/api/client';

export default function VisaoGeralScreen() {
  const router = useRouter();
  const { matricula, setMatricula, authenticated } = useAuth();
  const versionAlunos = useDataVersion('alunos');
  // Reagimos também a invalidações de empréstimos: ao finalizar uma leitura,
  // a contagem de "livros lidos" precisa ser recalculada.
  const versionEmprestimos = useDataVersion('emprestimos');

  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const data = await usuarioService.listAlunosVinculados();
      const list = Array.isArray(data) ? data : [];

      // ---------------------------------------------------------------
      // Workaround: o backend não incrementa aluno.qtd_livros_lidos
      // ao concluir uma leitura. Para que o card mostre o número real,
      // contamos os empréstimos com status FINALIZADO de cada aluno
      // em paralelo e usamos o maior valor entre o calculado e o do banco.
      // ---------------------------------------------------------------
      const enriched = await Promise.all(
        list.map(async (aluno) => {
          if (!aluno?.matricula) return aluno;
          try {
            const historico = await emprestimoService.listEmprestimos(aluno.matricula);
            const contagem = (Array.isArray(historico) ? historico : []).filter(
              (e) => e.status === 'FINALIZADO'
            ).length;
            const qtdServer = Number(aluno.qtdLivrosLidos ?? 0);
            return {
              ...aluno,
              qtdLivrosLidos: Math.max(qtdServer, contagem),
            };
          } catch {
            return aluno; // mantém o valor original se a chamada falhar
          }
        })
      );

      setAlunos(enriched);

      // Auto-seleção: se nada selecionado e há alunos, seleciona o primeiro.
      if (!matricula && enriched.length) {
        await setMatricula(enriched[0].matricula);
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message || 'Falha ao carregar alunos.'
          : 'Falha de conexão.';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [matricula, setMatricula]);

  useEffect(() => {
    if (!authenticated) return;
    setLoading(true);
    fetchData();
  }, [authenticated, fetchData, versionAlunos, versionEmprestimos]);

  const handleSelecionarAluno = async (mat) => {
    await setMatricula(mat);
    router.push('/leituras');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
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
        <Text style={styles.title}>Visão geral</Text>
        <Text style={styles.subtitle}>Acompanhe a leitura de cada aluno vinculado</Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#0292B7" />
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchData} style={styles.retryBtn}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : alunos.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.empty}>
              Nenhum aluno vinculado ainda.{'\n'}Vincule pelo menu de perfil.
            </Text>
          </View>
        ) : (
          alunos.map((aluno) => (
            <TouchableOpacity
              key={aluno.id ?? aluno.matricula}
              style={[
                styles.card,
                aluno.matricula === matricula && styles.cardActive,
              ]}
              activeOpacity={0.85}
              onPress={() => handleSelecionarAluno(aluno.matricula)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.alunoNome}>{aluno.nome}</Text>
                {aluno.matricula === matricula && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Atual</Text>
                  </View>
                )}
              </View>
              <View style={styles.row}>
                <GraduationCap size={14} color="#777777" />
                <Text style={styles.meta}>RA {aluno.matricula}</Text>
                {!!aluno.turma && <Text style={styles.meta}>· {aluno.turma}</Text>}
              </View>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{aluno.qtdLivrosLidos ?? 0}</Text>
                  <Text style={styles.statLabel}>livros lidos</Text>
                </View>
                <View style={styles.statSep} />
                <View style={styles.stat}>
                  <View style={styles.row}>
                    <BookOpen size={14} color="#0292B7" />
                    <Text style={styles.statLabelCurrent} numberOfLines={1}>
                      {aluno.livroAtual || 'Nenhuma leitura'}
                    </Text>
                  </View>
                  <Text style={styles.statSubLabel}>livro atual</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F2EB' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontFamily: 'KoHo_700Bold', fontSize: 22, color: '#1A1A1A' },
  subtitle: {
    fontFamily: 'KoHo_400Regular',
    fontSize: 13,
    color: '#777777',
    marginTop: 4,
    marginBottom: 16,
  },
  center: { paddingVertical: 40, alignItems: 'center' },
  empty: {
    fontFamily: 'KoHo_400Regular',
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorBox: { padding: 16, alignItems: 'center' },
  errorText: { fontFamily: 'KoHo_500Medium', fontSize: 13, color: '#B43D35' },
  retryBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#0292B7',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  retryText: { fontFamily: 'KoHo_600SemiBold', fontSize: 12, color: '#0292B7' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardActive: { borderColor: '#0292B7' },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  alunoNome: { fontFamily: 'KoHo_600SemiBold', fontSize: 16, color: '#1A1A1A' },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#E0F2F8',
  },
  activeBadgeText: { fontFamily: 'KoHo_600SemiBold', fontSize: 11, color: '#036C87' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontFamily: 'KoHo_400Regular', fontSize: 12, color: '#777777' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EDE6',
  },
  stat: { flex: 1 },
  statSep: { width: 1, height: 28, backgroundColor: '#F0EDE6', marginHorizontal: 12 },
  statValue: { fontFamily: 'KoHo_700Bold', fontSize: 22, color: '#0292B7' },
  statLabel: { fontFamily: 'KoHo_400Regular', fontSize: 11, color: '#777777' },
  statLabelCurrent: {
    fontFamily: 'KoHo_600SemiBold',
    fontSize: 13,
    color: '#1A1A1A',
    flexShrink: 1,
  },
  statSubLabel: { fontFamily: 'KoHo_400Regular', fontSize: 11, color: '#777777', marginTop: 2 },
});
