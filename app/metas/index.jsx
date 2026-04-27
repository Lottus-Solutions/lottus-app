import React, { useCallback, useEffect, useState } from 'react';
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
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Trash2 } from 'lucide-react-native';

import { useAuth } from '../../src/context/AuthContext';
import { useDataSync, useDataVersion } from '../../src/context/DataSyncContext';
import metaService from '../../src/services/metaService';
import { ApiError } from '../../src/api/client';

const TIPOS = [
  { value: 'LIVROS_LIDOS', label: 'Livros lidos' },
  { value: 'LIVROS_COM_PALAVRA_CHAVE', label: 'Livros por palavra-chave' },
  { value: 'CUSTOM', label: 'Personalizada' },
];

const VALIDACOES = [
  { value: 'PERCENTUAL', label: 'Percentual' },
  { value: 'BOOLEAN', label: 'Concluída ou não' },
];

function isoToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function isoEndOfMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function ProgressBar({ progress, color }) {
  const pct = Math.min(1, Math.max(0, progress || 0));
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

function GoalCard({ meta, onDelete }) {
  const valorAtual = meta.valorAtual ?? 0;
  const valorAlvo = meta.valorAlvo ?? 1;
  const ratio = meta.percentual != null ? meta.percentual / 100 : valorAtual / valorAlvo;
  const percent = Math.round(Math.min(100, Math.max(0, (ratio || 0) * 100)));
  const color =
    percent >= 75 ? '#2E7D4F' : percent >= 35 ? '#F5C842' : '#F28B82';
  const textColor =
    percent >= 75 ? '#2E7D4F' : percent >= 35 ? '#B7770D' : '#C0392B';
  const startLabel = (meta.dataInicio || '').split('-').slice(1).reverse().join('/');

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{meta.titulo || TIPOS.find((t) => t.value === meta.tipo)?.label}</Text>
          {!!meta.descricao && <Text style={styles.cardDescription}>{meta.descricao}</Text>}
          <Text style={styles.cardDate}>Início {startLabel || meta.dataInicio || '-'}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: color + '33' }]}>
          <Text style={[styles.badgeText, { color: textColor }]}>{percent}%</Text>
        </View>
      </View>
      <ProgressBar progress={ratio} color={color} />
      <View style={styles.cardFooter}>
        <Text style={styles.cardMeta}>
          {valorAtual}/{valorAlvo} · {meta.status}
        </Text>
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
          <Trash2 size={14} color="#B43D35" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function NovaMetaModal({ visible, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState({
    tipo: 'LIVROS_LIDOS',
    titulo: '',
    descricao: '',
    tipoValidacao: 'PERCENTUAL',
    valorAlvo: '4',
    filtroValor: '',
    dataInicio: isoToday(),
    dataFim: isoEndOfMonth(),
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setForm({
        tipo: 'LIVROS_LIDOS',
        titulo: '',
        descricao: '',
        tipoValidacao: 'PERCENTUAL',
        valorAlvo: '4',
        filtroValor: '',
        dataInicio: isoToday(),
        dataFim: isoEndOfMonth(),
      });
      setError('');
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!form.dataInicio || !form.dataFim) {
      setError('Datas de início e fim são obrigatórias.');
      return;
    }
    if (form.tipoValidacao === 'PERCENTUAL' && !Number(form.valorAlvo)) {
      setError('Valor alvo é obrigatório para meta percentual.');
      return;
    }
    setError('');
    try {
      const payload = {
        tipo: form.tipo,
        titulo: form.titulo || undefined,
        descricao: form.descricao || undefined,
        tipoValidacao: form.tipoValidacao,
        valorAlvo:
          form.tipoValidacao === 'BOOLEAN' ? 1 : Math.max(1, Number(form.valorAlvo) || 1),
        filtroValor:
          form.tipo === 'LIVROS_COM_PALAVRA_CHAVE' ? form.filtroValor || undefined : undefined,
        dataInicio: form.dataInicio,
        dataFim: form.dataFim,
      };
      await onSubmit(payload);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message || 'Falha ao criar meta.' : 'Erro de conexão.';
      setError(msg);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.modalSheet}>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>Nova meta</Text>

            <Text style={styles.modalLabel}>Tipo</Text>
            <View style={styles.chipsRow}>
              {TIPOS.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.chip, form.tipo === t.value && styles.chipActive]}
                  onPress={() => setForm((s) => ({ ...s, tipo: t.value }))}
                >
                  <Text style={[styles.chipText, form.tipo === t.value && styles.chipTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Validação</Text>
            <View style={styles.chipsRow}>
              {VALIDACOES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.chip, form.tipoValidacao === t.value && styles.chipActive]}
                  onPress={() => setForm((s) => ({ ...s, tipoValidacao: t.value }))}
                >
                  <Text
                    style={[
                      styles.chipText,
                      form.tipoValidacao === t.value && styles.chipTextActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Título</Text>
            <TextInput
              style={styles.modalInput}
              value={form.titulo}
              onChangeText={(v) => setForm((s) => ({ ...s, titulo: v }))}
              placeholder="Ex: Ler 4 livros no mês"
              placeholderTextColor="#B8B2A8"
            />

            <Text style={styles.modalLabel}>Descrição</Text>
            <TextInput
              style={styles.modalInput}
              value={form.descricao}
              onChangeText={(v) => setForm((s) => ({ ...s, descricao: v }))}
              placeholder="Opcional"
              placeholderTextColor="#B8B2A8"
            />

            {form.tipoValidacao === 'PERCENTUAL' && (
              <>
                <Text style={styles.modalLabel}>Valor alvo</Text>
                <TextInput
                  style={styles.modalInput}
                  value={String(form.valorAlvo)}
                  onChangeText={(v) =>
                    setForm((s) => ({ ...s, valorAlvo: v.replace(/\D/g, '') }))
                  }
                  keyboardType="numeric"
                  placeholder="4"
                  placeholderTextColor="#B8B2A8"
                />
              </>
            )}

            {form.tipo === 'LIVROS_COM_PALAVRA_CHAVE' && (
              <>
                <Text style={styles.modalLabel}>Palavra-chave</Text>
                <TextInput
                  style={styles.modalInput}
                  value={form.filtroValor}
                  onChangeText={(v) => setForm((s) => ({ ...s, filtroValor: v }))}
                  placeholder="Ex: fantasia"
                  placeholderTextColor="#B8B2A8"
                />
              </>
            )}

            <View style={styles.dateRow}>
              <View style={styles.dateCol}>
                <Text style={styles.modalLabel}>Início</Text>
                <TextInput
                  style={styles.modalInput}
                  value={form.dataInicio}
                  onChangeText={(v) => setForm((s) => ({ ...s, dataInicio: v }))}
                  placeholder="2026-04-01"
                  placeholderTextColor="#B8B2A8"
                />
              </View>
              <View style={styles.dateCol}>
                <Text style={styles.modalLabel}>Fim</Text>
                <TextInput
                  style={styles.modalInput}
                  value={form.dataFim}
                  onChangeText={(v) => setForm((s) => ({ ...s, dataFim: v }))}
                  placeholder="2026-04-30"
                  placeholderTextColor="#B8B2A8"
                />
              </View>
            </View>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={onClose} disabled={submitting}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmit, submitting && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Criar meta</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function MetasScreen() {
  const { matricula, authenticated } = useAuth();
  const { invalidate } = useDataSync();
  const versionMetas = useDataVersion('metas');
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!matricula) {
      setGoals([]);
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const data = await metaService.listMetas(matricula);
      // Ordena: ATIVAs primeiro, depois CONCLUIDAs, depois ARQUIVADAs.
      // Dentro do mesmo status, mais novas (id desc) no topo.
      const order = { ATIVA: 0, CONCLUIDA: 1, ARQUIVADA: 2 };
      const sorted = (Array.isArray(data) ? data : []).slice().sort((a, b) => {
        const sa = order[a.status] ?? 99;
        const sb = order[b.status] ?? 99;
        if (sa !== sb) return sa - sb;
        return (b.id || 0) - (a.id || 0);
      });
      setGoals(sorted);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Falha ao carregar metas.';
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
  }, [authenticated, fetchData, versionMetas]);

  const handleCreate = async (payload) => {
    setSubmitting(true);
    try {
      await metaService.createMeta(matricula, payload);
      setOpenModal(false);
      invalidate('metas');
      await fetchData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (meta) => {
    const confirmDelete = async () => {
      try {
        await metaService.deleteMeta(matricula, meta.id);
        invalidate('metas');
        await fetchData();
      } catch (err) {
        const msg =
          err instanceof ApiError ? err.message || 'Falha ao remover.' : 'Erro de conexão.';
        if (Platform.OS !== 'web') Alert.alert('Remover meta', msg);
      }
    };
    if (Platform.OS === 'web') {
      confirmDelete();
    } else {
      Alert.alert('Remover meta', 'Tem certeza que deseja remover esta meta?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: confirmDelete },
      ]);
    }
  };

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
          style={[styles.addBtn, !matricula && { opacity: 0.5 }]}
          activeOpacity={0.85}
          onPress={() => setOpenModal(true)}
          disabled={!matricula}
        >
          <Text style={styles.addBtnText}>+ Adicionar meta</Text>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Metas mensais</Text>

        {!matricula ? (
          <Text style={styles.empty}>Selecione um aluno para ver as metas.</Text>
        ) : loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#0292B7" />
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : goals.length === 0 ? (
          <Text style={styles.empty}>
            Nenhuma meta definida ainda.{'\n'}Crie sua primeira meta!
          </Text>
        ) : (
          goals.map((g) => <GoalCard key={g.id} meta={g} onDelete={() => handleDelete(g)} />)
        )}
      </ScrollView>

      <NovaMetaModal
        visible={openModal}
        onClose={() => setOpenModal(false)}
        onSubmit={handleCreate}
        submitting={submitting}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F2EB' },
  scroll: { flex: 1, paddingHorizontal: 20 },
  content: { paddingTop: 16, paddingBottom: 32 },
  addBtn: {
    backgroundColor: '#0292B7',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  addBtnText: { fontFamily: 'KoHo_600SemiBold', fontSize: 15, color: '#FFFFFF' },
  sectionLabel: { fontFamily: 'KoHo_500Medium', fontSize: 13, color: '#999999', marginBottom: 10 },
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfo: { flex: 1, marginRight: 12 },
  cardTitle: { fontFamily: 'KoHo_600SemiBold', fontSize: 15, color: '#1A1A1A' },
  cardDescription: {
    fontFamily: 'KoHo_400Regular',
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  cardDate: { fontFamily: 'KoHo_400Regular', fontSize: 12, color: '#999999', marginTop: 1 },
  badge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { fontFamily: 'KoHo_600SemiBold', fontSize: 12 },
  progressTrack: {
    marginTop: 12,
    height: 6,
    backgroundColor: '#F0EDE6',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 999 },
  cardFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardMeta: { fontFamily: 'KoHo_400Regular', fontSize: 11, color: '#999999' },
  deleteBtn: { padding: 4 },
  empty: {
    fontFamily: 'KoHo_400Regular',
    fontSize: 15,
    color: '#999999',
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 24,
  },
  center: { paddingVertical: 40, alignItems: 'center' },
  errorText: {
    fontFamily: 'KoHo_500Medium',
    fontSize: 13,
    color: '#B43D35',
    textAlign: 'center',
    paddingTop: 16,
  },
  /* Modal */
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '90%',
  },
  modalContent: { padding: 20, paddingBottom: 36 },
  modalTitle: { fontFamily: 'KoHo_700Bold', fontSize: 18, color: '#036C87', marginBottom: 14 },
  modalLabel: {
    fontFamily: 'KoHo_500Medium',
    fontSize: 12,
    color: '#777777',
    marginTop: 12,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E4DFD5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'KoHo_400Regular',
    fontSize: 14,
    color: '#1A1A1A',
    backgroundColor: '#FAFAF7',
  },
  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D8D5CD',
    backgroundColor: '#FFFFFF',
  },
  chipActive: { borderColor: '#0292B7', backgroundColor: '#E0F2F8' },
  chipText: { fontFamily: 'KoHo_500Medium', fontSize: 12, color: '#555555' },
  chipTextActive: { color: '#036C87', fontFamily: 'KoHo_600SemiBold' },
  dateRow: { flexDirection: 'row', gap: 12 },
  dateCol: { flex: 1 },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  modalCancel: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8D5CD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: { fontFamily: 'KoHo_600SemiBold', fontSize: 14, color: '#777777' },
  modalSubmit: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#0292B7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: { fontFamily: 'KoHo_600SemiBold', fontSize: 14, color: '#FFFFFF' },
});
