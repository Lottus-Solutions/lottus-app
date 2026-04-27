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
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';

import { useAuth } from '../../src/context/AuthContext';
import { useDataSync, useDataVersion } from '../../src/context/DataSyncContext';
import emprestimoService from '../../src/services/emprestimoService';
import assistenteService from '../../src/services/assistenteService';
import usuarioService from '../../src/services/usuarioService';
import { ApiError } from '../../src/api/client';

function diasAteData(dateStr) {
  if (!dateStr) return null;
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
  return diff;
}

function formatDate(iso) {
  if (!iso) return '-';
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

function formatRecommendationItem(item) {
  if (item == null) return '';
  if (typeof item === 'string') return item;
  if (typeof item !== 'object') return String(item);

  const title = item.titulo || item.livroTitulo || item.nome || item.title || 'Recomendação';
  const author = item.autor || item.autora || item.writer;
  const reason = item.motivo || item.justificativa || item.descricao || item.resumo;

  const lines = [title];
  if (author) lines.push(author);
  if (reason) lines.push(reason);
  return lines.join('\n');
}

function CurrentBookCard({ emprestimo, onFinalize, finalizing }) {
  const dueDays = diasAteData(emprestimo.dataDevolucaoPrevista);
  const dueLabel =
    dueDays === null
      ? ''
      : dueDays > 0
      ? `em ${dueDays} dias`
      : dueDays === 0
      ? 'hoje'
      : `há ${Math.abs(dueDays)} dias (atrasado)`;

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{emprestimo.livroTitulo}</Text>
          <Text style={styles.cardGenre}>RA {emprestimo.alunoMatricula}</Text>
          <Text style={styles.cardDue}>
            Devolução <Text style={styles.cardDueBold}>{dueLabel}</Text>
          </Text>
        </View>
        <TouchableOpacity
          onPress={onFinalize}
          style={[styles.finalizeBtn, finalizing && styles.finalizeBtnDisabled]}
          activeOpacity={0.8}
          disabled={finalizing}
        >
          {finalizing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.finalizeText}>Finalizar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function LeiturasScreen() {
  const router = useRouter();
  const { matricula, authenticated } = useAuth();
  const { invalidate } = useDataSync();
  const versionEmprestimos = useDataVersion('emprestimos');

  const [atual, setAtual] = useState(null);
  const [pendentes, setPendentes] = useState([]); // últimas finalizadas
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [finalizing, setFinalizing] = useState(false);
  const [loadingAlunoIA, setLoadingAlunoIA] = useState(true);
  const [alunoIA, setAlunoIA] = useState(null);
  const [recomendando, setRecomendando] = useState(false);
  const [recomendacoes, setRecomendacoes] = useState(null);
  const [recomendacoesError, setRecomendacoesError] = useState('');
  const [recomendacoesMessage, setRecomendacoesMessage] = useState('');

  const fetchData = useCallback(async () => {
    if (!matricula) {
      setLoading(false);
      setAtual(null);
      setPendentes([]);
      return;
    }
    setError(null);
    try {
      const [atualData, historico] = await Promise.all([
        emprestimoService.getEmprestimoAtual(matricula).catch(() => null),
        emprestimoService.listEmprestimos(matricula).catch(() => []),
      ]);
      setAtual(atualData || null);
      const finalizados = (Array.isArray(historico) ? historico : [])
        .filter((e) => e.status === 'FINALIZADO')
        // Mais recente no topo: ordena por dataDevolucaoEfetiva desc, fallback por id desc.
        .sort((a, b) => {
          const da = a.dataDevolucaoEfetiva || '';
          const db = b.dataDevolucaoEfetiva || '';
          if (da !== db) return db.localeCompare(da);
          return (b.id || 0) - (a.id || 0);
        });
      setPendentes(finalizados.slice(0, 5));
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Falha ao carregar leituras.';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [matricula]);

  const fetchAlunoIA = useCallback(async () => {
    if (!matricula) {
      setAlunoIA(null);
      setLoadingAlunoIA(false);
      return;
    }

    setLoadingAlunoIA(true);
    try {
      const alunos = await usuarioService.listAlunosVinculados();
      if (!Array.isArray(alunos) || alunos.length === 0) {
        setAlunoIA(null);
        return;
      }

      const selectedByMatricula = alunos.find((aluno) => String(aluno?.matricula) === String(matricula));
      setAlunoIA(selectedByMatricula || alunos[0] || null);
    } catch {
      setAlunoIA(null);
    } finally {
      setLoadingAlunoIA(false);
    }
  }, [matricula]);

  // Reage a:
  // - login (authenticated)
  // - troca de matrícula
  // - invalidações externas (versionEmprestimos)
  useEffect(() => {
    if (!authenticated) return;
    setLoading(true);
    fetchData();
  }, [authenticated, fetchData, versionEmprestimos]);

  useEffect(() => {
    if (!authenticated) return;
    fetchAlunoIA();
  }, [authenticated, fetchAlunoIA]);

  // Recarrega ao voltar para esta tela.
  useFocusEffect(
    useCallback(() => {
      if (authenticated && matricula) fetchData();
    }, [authenticated, matricula, fetchData])
  );

  const handleFinalize = async () => {
    if (!atual || !matricula) return;
    setFinalizing(true);

    // Atualização OTIMISTA: move a leitura atual para o topo da lista de finalizadas
    // imediatamente, antes mesmo da resposta do backend.
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const finalizadoOtimista = {
      ...atual,
      status: 'FINALIZADO',
      dataDevolucaoEfetiva: todayIso,
    };
    const atualBackup = atual;
    const pendentesBackup = pendentes;
    setAtual(null);
    setPendentes((prev) => [finalizadoOtimista, ...prev].slice(0, 5));

    try {
      await emprestimoService.concluirLeitura(matricula, atual.id);
      // Sucesso: dispara invalidações para outras telas (Histórico, Metas, Visão Geral).
      invalidate(['emprestimos', 'metas', 'alunos']);
      // Refaz fetch local para pegar o estado canônico do backend.
      fetchData();
    } catch (err) {
      // Falha: rollback do otimismo.
      setAtual(atualBackup);
      setPendentes(pendentesBackup);
      const msg =
        err instanceof ApiError
          ? err.message || 'Não foi possível concluir a leitura.'
          : 'Erro de conexão.';
      if (Platform.OS !== 'web') Alert.alert('Finalizar leitura', msg);
      setError(msg);
    } finally {
      setFinalizing(false);
    }
  };

  const handleRecomendacoesIA = useCallback(async () => {
    if (recomendando || !alunoIA?.id) return;

    const alunoId = Number(alunoIA.id);
    if (!Number.isInteger(alunoId)) {
      setRecomendacoesError('Nenhum aluno valido foi encontrado para gerar recomendações.');
      return;
    }

    setRecomendando(true);
    setRecomendacoesError('');
    setRecomendacoesMessage('');
    setRecomendacoes(null);

    try {
      const result = await assistenteService.recomendarLeituras(alunoId);
      const rawRecomendacoes =
        result?.recomendacoes || result?.recommendations || result?.data || result;
      const list = Array.isArray(rawRecomendacoes)
        ? rawRecomendacoes
        : rawRecomendacoes
        ? [rawRecomendacoes]
        : [];

      setRecomendacoes(list);
      setRecomendacoesMessage('Recomendações da IA geradas com sucesso.');
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message || 'Nao foi possivel gerar as recomendações da IA.'
          : 'Nao foi possivel gerar as recomendações da IA.';
      setRecomendacoesError(msg);
    } finally {
      setRecomendando(false);
    }
  }, [alunoIA, recomendando]);

  const alunoIAText = useMemo(() => {
    if (loadingAlunoIA) return 'Carregando aluno selecionado para recomendações...';
    if (!alunoIA) return 'Nenhum aluno vinculado disponível para recomendações.';
    return `Aluno alvo: ${alunoIA.nome || 'Aluno'} (RA ${alunoIA.matricula})`;
  }, [alunoIA, loadingAlunoIA]);

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
        {!matricula ? (
          <View style={styles.center}>
            <Text style={styles.empty}>
              Selecione um aluno na Visão geral para ver as leituras.
            </Text>
          </View>
        ) : loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#0292B7" />
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Livro atual</Text>
            {atual ? (
              <CurrentBookCard
                emprestimo={atual}
                onFinalize={handleFinalize}
                finalizing={finalizing}
              />
            ) : (
              <View style={styles.card}>
                <Text style={styles.emptyInline}>Nenhuma leitura em andamento.</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => router.push('/nova-leitura')}
              style={styles.novaLeituraBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.novaLeituraText}>+ Nova leitura</Text>
            </TouchableOpacity>

            <View style={styles.aiCard}>
              <TouchableOpacity
                onPress={handleRecomendacoesIA}
                style={[
                  styles.aiBtn,
                  (recomendando || !alunoIA || loadingAlunoIA) && styles.aiBtnDisabled,
                ]}
                activeOpacity={0.85}
                disabled={recomendando || !alunoIA || loadingAlunoIA}
              >
                {recomendando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.aiBtnText}>Recomendações da IA</Text>
                )}
              </TouchableOpacity>

              {!!recomendacoesError && <Text style={styles.errorBanner}>{recomendacoesError}</Text>}
              {!!recomendacoesMessage && (
                <Text style={styles.successBanner}>{recomendacoesMessage}</Text>
              )}

              {Array.isArray(recomendacoes) && recomendacoes.length > 0 ? (
                <View style={styles.recommendationsWrap}>
                  {recomendacoes.map((item, index) => (
                    <View key={`${index}-${String(item?.id ?? item?.titulo ?? index)}`} style={styles.recommendationCard}>
                      <Text style={styles.recommendationText}>{formatRecommendationItem(item)}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Últimas finalizadas</Text>
            {pendentes.length === 0 ? (
              <Text style={styles.empty}>Nenhuma leitura finalizada ainda.</Text>
            ) : (
              pendentes.map((book) => (
                <View key={book.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{book.livroTitulo}</Text>
                  <Text style={styles.cardGenre}>
                    Devolvido em {formatDate(book.dataDevolucaoEfetiva)}
                  </Text>
                </View>
              ))
            )}

            {!!error && <Text style={styles.errorBanner}>{error}</Text>}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F2EB' },
  scroll: { flex: 1, paddingHorizontal: 20 },
  content: { paddingTop: 16, paddingBottom: 32 },
  center: { paddingVertical: 48, alignItems: 'center' },
  empty: {
    fontFamily: 'KoHo_400Regular',
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  emptyInline: {
    fontFamily: 'KoHo_400Regular',
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
  },
  sectionLabel: {
    fontFamily: 'KoHo_500Medium',
    fontSize: 13,
    color: '#999999',
    marginBottom: 8,
  },
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
  cardInfo: { flex: 1, marginRight: 12 },
  cardTitle: { fontFamily: 'KoHo_600SemiBold', fontSize: 15, color: '#1A1A1A' },
  cardGenre: { fontFamily: 'KoHo_400Regular', fontSize: 12, color: '#999999', marginTop: 2 },
  cardDue: { fontFamily: 'KoHo_400Regular', fontSize: 12, color: '#999999', marginTop: 2 },
  cardDueBold: { fontFamily: 'KoHo_600SemiBold', color: '#555555' },
  finalizeBtn: {
    backgroundColor: '#0292B7',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  finalizeBtnDisabled: { opacity: 0.6 },
  finalizeText: { fontFamily: 'KoHo_600SemiBold', fontSize: 12, color: '#FFFFFF' },
  novaLeituraBtn: { alignItems: 'center', paddingVertical: 12 },
  novaLeituraText: { fontFamily: 'KoHo_600SemiBold', fontSize: 15, color: '#0292B7' },
  aiCard: {
    marginTop: 4,
    marginBottom: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8ECF2',
    backgroundColor: '#F8FCFD',
    padding: 14,
  },
  aiHelperText: {
    marginBottom: 10,
    fontFamily: 'KoHo_400Regular',
    fontSize: 12,
    color: '#6A6A6A',
  },
  aiBtn: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: '#0292B7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBtnDisabled: {
    opacity: 0.6,
  },
  aiBtnText: {
    fontFamily: 'KoHo_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  recommendationsWrap: {
    marginTop: 12,
    gap: 10,
  },
  recommendationCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4F0F3',
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  recommendationText: {
    fontFamily: 'KoHo_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: '#1A1A1A',
  },
  successBanner: {
    fontFamily: 'KoHo_500Medium',
    fontSize: 12,
    color: '#2F885B',
    textAlign: 'center',
    marginTop: 12,
  },
  errorBanner: {
    fontFamily: 'KoHo_500Medium',
    fontSize: 12,
    color: '#B43D35',
    textAlign: 'center',
    marginTop: 12,
  },
});
