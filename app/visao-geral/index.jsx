import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  ListTodo,
  Target,
  TrendingUp,
} from 'lucide-react-native';

import { useAuth } from '../../src/context/AuthContext';
import { useDataVersion } from '../../src/context/DataSyncContext';
import { ApiError } from '../../src/api/client';
import dashboardService from '../../src/services/dashboardService';
import usuarioService from '../../src/services/usuarioService';

// ---------------------------------------------------------------------------
// Constantes de design (alinhadas ao Design System do projeto)
// ---------------------------------------------------------------------------
const COLORS = {
  bg: '#F5F2EB',
  surface: '#FFFFFF',
  primary: '#0292B7',
  primaryDark: '#036C87',
  primaryBg: '#E0F2F8',
  text: '#1A1A1A',
  textMuted: '#777777',
  textPlaceholder: '#999999',
  border: '#F0EDE6',
  error: '#B43D35',
  errorBg: '#FCF1F0',
  success: '#2F885B',
  successBg: '#D4EDDA',
  warning: '#B07D00',
  warningBg: '#FFF8E1',
  progressTrack: '#F0EDE6',
};

const NOMES_MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                     'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatarData(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = NOMES_MESES[d.getMonth()];
  const hora = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${dia} ${mes} · ${hora}`;
}

function corProgresso(percentual) {
  if (percentual >= 75) return COLORS.success;
  if (percentual >= 35) return COLORS.warning;
  return COLORS.error;
}

function iconeAtividade(tipo) {
  switch (tipo) {
    case 'LIVRO_CONCLUIDO': return <CheckCircle size={16} color={COLORS.success} />;
    case 'LIVRO_INICIADO':  return <BookOpen size={16} color={COLORS.primary} />;
    case 'META_CONCLUIDA':  return <Target size={16} color={COLORS.success} />;
    case 'META_CRIADA':     return <ListTodo size={16} color={COLORS.primary} />;
    default:                return <Calendar size={16} color={COLORS.textMuted} />;
  }
}

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------

/** Barra de progresso horizontal reutilizável */
function ProgressBar({ percentual, color }) {
  const pct = Math.min(100, Math.max(0, percentual ?? 0));
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: color ?? COLORS.primary }]} />
    </View>
  );
}

/** Card de KPI simples (ícone + valor + label) */
function KpiCard({ icon, value, label, sub }) {
  return (
    <View style={styles.kpiCard}>
      <View style={styles.kpiIconWrap}>{icon}</View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {!!sub && <Text style={styles.kpiSub}>{sub}</Text>}
    </View>
  );
}

/** Card: livro em leitura atual */
function CardLivroAtual({ titulo, diasComLivroAtual }) {
  if (!titulo) {
    return (
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <BookOpen size={16} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Leitura atual</Text>
        </View>
        <Text style={styles.emptyText}>Nenhuma leitura em andamento</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardTitleRow}>
        <BookOpen size={16} color={COLORS.primary} />
        <Text style={styles.cardTitle}>Leitura atual</Text>
      </View>
      <Text style={styles.livroTitulo} numberOfLines={2}>{titulo}</Text>
      {diasComLivroAtual != null && (
        <View style={styles.diasRow}>
          <Calendar size={13} color={COLORS.textMuted} />
          <Text style={styles.diasText}>
            {diasComLivroAtual === 0
              ? 'Iniciada hoje'
              : `${diasComLivroAtual} dia${diasComLivroAtual !== 1 ? 's' : ''} em leitura`}
          </Text>
        </View>
      )}
    </View>
  );
}

/** Card: metas do mês */
function CardMetasMensais({ percentual, total, concluidas }) {
  if (total === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Target size={16} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Metas do mês</Text>
        </View>
        <Text style={styles.emptyText}>Nenhuma meta ativa neste mês</Text>
      </View>
    );
  }

  const cor = corProgresso(percentual);

  return (
    <View style={styles.card}>
      <View style={styles.cardTitleRow}>
        <Target size={16} color={COLORS.primary} />
        <Text style={styles.cardTitle}>Metas do mês</Text>
        <View style={[styles.badge, { backgroundColor: cor + '22' }]}>
          <Text style={[styles.badgeText, { color: cor }]}>{percentual}%</Text>
        </View>
      </View>
      <ProgressBar percentual={percentual} color={cor} />
      <Text style={styles.metaDetalhe}>
        {concluidas} de {total} meta{total !== 1 ? 's' : ''} concluída{concluidas !== 1 ? 's' : ''}
      </Text>
    </View>
  );
}

/** Card: evolução mensal (gráfico de barras nativo) */
function CardEvolucaoMensal({ dados }) {
  if (!dados || dados.length === 0) return null;

  const maxTotal = Math.max(...dados.map((d) => d.total), 1);

  return (
    <View style={styles.card}>
      <View style={styles.cardTitleRow}>
        <TrendingUp size={16} color={COLORS.primary} />
        <Text style={styles.cardTitle}>Livros lidos por mês</Text>
      </View>
      <View style={styles.barChart}>
        {dados.map((item, i) => {
          const altura = Math.max(4, (item.total / maxTotal) * 80);
          const isAtual = i === dados.length - 1;
          return (
            <View key={`${item.ano}-${item.mes}`} style={styles.barCol}>
              <Text style={styles.barValue}>{item.total > 0 ? item.total : ''}</Text>
              <View
                style={[
                  styles.bar,
                  { height: altura, backgroundColor: isAtual ? COLORS.primary : COLORS.primaryBg },
                ]}
              />
              <Text style={[styles.barLabel, isAtual && styles.barLabelAtual]}>
                {NOMES_MESES[item.mes - 1]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** Card: distribuição por gênero (barras horizontais) */
function CardGeneros({ dados }) {
  if (!dados || dados.length === 0) return null;

  const top = dados.slice(0, 5);

  return (
    <View style={styles.card}>
      <View style={styles.cardTitleRow}>
        <LayoutDashboard size={16} color={COLORS.primary} />
        <Text style={styles.cardTitle}>Gêneros mais lidos</Text>
      </View>
      {top.map((item) => (
        <View key={item.categoria} style={styles.generoRow}>
          <Text style={styles.generoNome} numberOfLines={1}>
            {item.categoria === 'SEM_CATEGORIA' ? 'Sem categoria' : item.categoria}
          </Text>
          <View style={styles.generoBarWrap}>
            <View style={[styles.generoBar, { width: `${item.percentual}%` }]} />
          </View>
          <Text style={styles.generoPercent}>{Math.round(item.percentual)}%</Text>
        </View>
      ))}
    </View>
  );
}

/** Card: feed de atividades recentes */
function CardAtividades({ atividades }) {
  if (!atividades || atividades.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.cardTitleRow}>
        <Calendar size={16} color={COLORS.primary} />
        <Text style={styles.cardTitle}>Atividades recentes</Text>
      </View>
      {atividades.map((item, i) => (
        <View
          key={item.id}
          style={[styles.atividadeRow, i < atividades.length - 1 && styles.atividadeSep]}
        >
          <View style={styles.atividadeIcon}>{iconeAtividade(item.tipo)}</View>
          <View style={styles.atividadeInfo}>
            <Text style={styles.atividadeTexto}>{item.tituloResumo}</Text>
            <Text style={styles.atividadeData}>{formatarData(item.ocorridoEm)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/** Seletor de aluno (quando há mais de um vinculado) */
function SeletorAluno({ alunos, matriculaSelecionada, onSelecionar }) {
  if (alunos.length <= 1) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.seletorScroll}
      contentContainerStyle={styles.seletorContent}
    >
      {alunos.map((aluno) => {
        const ativo = aluno.matricula === matriculaSelecionada;
        return (
          <TouchableOpacity
            key={aluno.matricula}
            style={[styles.seletorChip, ativo && styles.seletorChipAtivo]}
            activeOpacity={0.8}
            onPress={() => onSelecionar(aluno.matricula)}
          >
            <GraduationCap size={13} color={ativo ? COLORS.primaryDark : COLORS.textMuted} />
            <Text style={[styles.seletorNome, ativo && styles.seletorNomeAtivo]}>
              {aluno.nome.split(' ')[0]}
            </Text>
            {ativo && <ChevronRight size={12} color={COLORS.primaryDark} />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Tela principal
// ---------------------------------------------------------------------------
export default function VisaoGeralScreen() {
  const { user, matricula, setMatricula, authenticated } = useAuth();
  const versionAlunos = useDataVersion('alunos');
  const versionEmprestimos = useDataVersion('emprestimos');
  const versionMetas = useDataVersion('metas');

  const [alunos, setAlunos] = useState([]);
  const [matriculaAtiva, setMatriculaAtiva] = useState(matricula);
  const [resumo, setResumo] = useState(null);
  const [evolucao, setEvolucao] = useState([]);
  const [generos, setGeneros] = useState([]);
  const [atividades, setAtividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Sincroniza a matrícula ativa com o contexto externo
  const matriculaRef = useRef(matriculaAtiva);
  useEffect(() => {
    matriculaRef.current = matriculaAtiva;
  }, [matriculaAtiva]);

  // ---------------------------------------------------------------------------
  const fetchDados = useCallback(async (mat) => {
    if (!mat) return;
    setError(null);
    try {
      const [r, e, g, a] = await Promise.all([
        dashboardService.getResumo(mat),
        dashboardService.getEvolucaoMensal(mat, 6),
        dashboardService.getGeneros(mat),
        dashboardService.getAtividades(mat, 10),
      ]);
      setResumo(r ?? null);
      setEvolucao(Array.isArray(e) ? e : []);
      setGeneros(Array.isArray(g) ? g : []);
      setAtividades(Array.isArray(a) ? a : []);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message || 'Falha ao carregar dashboard.'
          : 'Falha de conexão.';
      setError(msg);
    }
  }, []);

  const fetchTudo = useCallback(async () => {
    setError(null);
    try {
      const lista = await usuarioService.listAlunosVinculados();
      const list = Array.isArray(lista) ? lista : [];
      setAlunos(list);

      let mat = matriculaRef.current;
      if (!mat && list.length) {
        mat = list[0].matricula;
        setMatriculaAtiva(mat);
        await setMatricula(mat);
      }

      if (mat) await fetchDados(mat);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message || 'Falha ao carregar dados.'
          : 'Falha de conexão.';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchDados, setMatricula]);

  useEffect(() => {
    if (!authenticated) return;
    setLoading(true);
    fetchTudo();
  }, [authenticated, fetchTudo, versionAlunos, versionEmprestimos, versionMetas]);

  const handleSelecionarAluno = useCallback(
    async (mat) => {
      setMatriculaAtiva(mat);
      await setMatricula(mat);
      setLoading(true);
      await fetchDados(mat);
      setLoading(false);
    },
    [fetchDados, setMatricula]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTudo();
  }, [fetchTudo]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const primeiroNome = user?.nome?.split(' ')[0] ?? 'você';

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !resumo) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingCenter}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchTudo} style={styles.retryBtn}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (alunos.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingCenter}>
          <GraduationCap size={40} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>Nenhum aluno vinculado.{'\n'}Vincule pelo menu de perfil.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Saudação */}
        <Text style={styles.greeting}>Olá, {primeiroNome} 👋</Text>
        <Text style={styles.subtitle}>Acompanhe a leitura do seu filho(a)</Text>

        {/* Seletor de aluno (visível apenas quando há mais de um) */}
        <SeletorAluno
          alunos={alunos}
          matriculaSelecionada={matriculaAtiva}
          onSelecionar={handleSelecionarAluno}
        />

        {resumo ? (
          <>
            {/* KPIs do mês */}
            <View style={styles.kpiGrid}>
              <KpiCard
                icon={<BookOpen size={18} color={COLORS.primary} />}
                value={resumo.livrosLidosNoMes ?? 0}
                label="livros no mês"
              />
              <KpiCard
                icon={<CheckCircle size={18} color={COLORS.success} />}
                value={`${resumo.metasMensaisConcluidas ?? 0}/${resumo.totalMetasMensais ?? 0}`}
                label="metas concluídas"
              />
            </View>

            {/* Livro atual */}
            <CardLivroAtual
              titulo={resumo.tituloLivroAtual}
              diasComLivroAtual={resumo.diasComLivroAtual}
            />

            {/* Metas do mês */}
            <CardMetasMensais
              percentual={resumo.percentualMetasMensais ?? 0}
              total={resumo.totalMetasMensais ?? 0}
              concluidas={resumo.metasMensaisConcluidas ?? 0}
            />
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.emptyText}>Nenhum dado disponível para este aluno.</Text>
          </View>
        )}

        {/* Evolução mensal */}
        <CardEvolucaoMensal dados={evolucao} />

        {/* Gêneros */}
        <CardGeneros dados={generos} />

        {/* Atividades recentes */}
        <CardAtividades atividades={atividades} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 },

  // Tipografia geral
  greeting: { fontFamily: 'KoHo_700Bold', fontSize: 22, color: COLORS.text },
  subtitle: {
    fontFamily: 'KoHo_400Regular',
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 16,
  },
  emptyText: {
    fontFamily: 'KoHo_400Regular',
    fontSize: 14,
    color: COLORS.textPlaceholder,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: { fontFamily: 'KoHo_500Medium', fontSize: 13, color: COLORS.error, textAlign: 'center' },
  retryBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  retryText: { fontFamily: 'KoHo_600SemiBold', fontSize: 12, color: COLORS.primary },

  // Seletor de aluno
  seletorScroll: { marginBottom: 16 },
  seletorContent: { gap: 8, paddingRight: 4 },
  seletorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  seletorChipAtivo: {
    backgroundColor: COLORS.primaryBg,
    borderColor: COLORS.primary,
  },
  seletorNome: { fontFamily: 'KoHo_500Medium', fontSize: 13, color: COLORS.textMuted },
  seletorNomeAtivo: { color: COLORS.primaryDark, fontFamily: 'KoHo_600SemiBold' },

  // Card base
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: 'KoHo_600SemiBold',
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },

  // KPI grid
  kpiGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 4,
  },
  kpiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  kpiValue: { fontFamily: 'KoHo_700Bold', fontSize: 22, color: COLORS.primary },
  kpiLabel: { fontFamily: 'KoHo_400Regular', fontSize: 11, color: COLORS.textMuted, textAlign: 'center' },
  kpiSub: { fontFamily: 'KoHo_400Regular', fontSize: 10, color: COLORS.textPlaceholder },

  // Progress bar
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: COLORS.progressTrack,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: 6, borderRadius: 999 },

  // Badge
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: { fontFamily: 'KoHo_700Bold', fontSize: 11 },

  // Livro atual
  livroTitulo: {
    fontFamily: 'KoHo_600SemiBold',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  diasRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  diasText: { fontFamily: 'KoHo_400Regular', fontSize: 12, color: COLORS.textMuted },

  // Metas
  metaDetalhe: { fontFamily: 'KoHo_400Regular', fontSize: 12, color: COLORS.textMuted },

  // Gráfico de barras (evolução mensal)
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 110,
    paddingTop: 4,
  },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bar: { width: '60%', borderRadius: 4, minHeight: 4 },
  barValue: { fontFamily: 'KoHo_600SemiBold', fontSize: 10, color: COLORS.primary, minHeight: 14 },
  barLabel: { fontFamily: 'KoHo_400Regular', fontSize: 10, color: COLORS.textMuted },
  barLabelAtual: { color: COLORS.primary, fontFamily: 'KoHo_600SemiBold' },

  // Gêneros
  generoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  generoNome: {
    fontFamily: 'KoHo_400Regular',
    fontSize: 12,
    color: COLORS.text,
    width: 100,
  },
  generoBarWrap: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: COLORS.progressTrack,
    overflow: 'hidden',
  },
  generoBar: { height: 6, borderRadius: 999, backgroundColor: COLORS.primary },
  generoPercent: {
    fontFamily: 'KoHo_600SemiBold',
    fontSize: 11,
    color: COLORS.textMuted,
    width: 34,
    textAlign: 'right',
  },

  // Atividades
  atividadeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  atividadeSep: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  atividadeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  atividadeInfo: { flex: 1 },
  atividadeTexto: { fontFamily: 'KoHo_500Medium', fontSize: 13, color: COLORS.text, lineHeight: 18 },
  atividadeData: { fontFamily: 'KoHo_400Regular', fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
});
