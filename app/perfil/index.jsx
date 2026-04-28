import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ApiError } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { useDataSync } from '../../src/context/DataSyncContext';
import assistenteService from '../../src/services/assistenteService';
import usuarioService from '../../src/services/usuarioService';

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function formatPhone(raw) {
  const digits = digitsOnly(raw).slice(0, 20);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

function formatAiResult(result) {
  if (result == null) return '';
  if (typeof result === 'string') return result;
  if (Array.isArray(result)) {
    return result
      .map((item) => {
        if (item == null) return '';
        if (typeof item === 'string') return item;
        if (typeof item !== 'object') return String(item);

        return (
          item.titulo ||
          item.livroTitulo ||
          item.nome ||
          item.texto ||
          item.descricao ||
          JSON.stringify(item)
        );
      })
      .filter(Boolean)
      .join('\n');
  }

  if (typeof result !== 'object') return String(result);

  const keys = ['resumo', 'perfil', 'nivel', 'pontuacao', 'descricao', 'observacao', 'texto', 'message'];
  const lines = keys
    .map((key) => {
      const value = result[key];
      if (value == null || value === '') return null;
      if (Array.isArray(value)) return `${key}: ${value.join(', ')}`;
      if (typeof value === 'object') return `${key}: ${JSON.stringify(value)}`;
      return `${key}: ${value}`;
    })
    .filter(Boolean);

  return lines.length ? lines.join('\n') : JSON.stringify(result, null, 2);
}

export default function PerfilScreen() {
  const { user, matricula, setMatricula, refreshProfile } = useAuth();
  const { invalidate } = useDataSync();

  const [nome, setNome] = useState(user?.nome || '');
  const [telefone, setTelefone] = useState(formatPhone(user?.telefone || ''));
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  const [recalculatingPerfil, setRecalculatingPerfil] = useState(false);
  const [perfilLeituraResult, setPerfilLeituraResult] = useState(null);
  const [perfilLeituraMessage, setPerfilLeituraMessage] = useState('');
  const [perfilLeituraError, setPerfilLeituraError] = useState('');

  const [alunos, setAlunos] = useState([]);
  const [loadingAlunos, setLoadingAlunos] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alunosError, setAlunosError] = useState('');

  const [ra, setRa] = useState('');
  const [raInfo, setRaInfo] = useState(null);
  const [verifyingRa, setVerifyingRa] = useState(false);
  const [linkingRa, setLinkingRa] = useState(false);

  useEffect(() => {
    setNome(user?.nome || '');
    setTelefone(formatPhone(user?.telefone || ''));
  }, [user?.nome, user?.telefone]);

  const hasProfileChanges = useMemo(() => {
    const currentNome = (user?.nome || '').trim();
    const currentTelefone = digitsOnly(user?.telefone || '');
    return (
      nome.trim() !== currentNome ||
      digitsOnly(telefone) !== currentTelefone
    );
  }, [nome, telefone, user?.nome, user?.telefone]);

  const alunoSelecionado = useMemo(() => {
    if (!Array.isArray(alunos) || alunos.length === 0) return null;

    const alunoDaMatricula = matricula
      ? alunos.find((aluno) => String(aluno?.matricula) === String(matricula))
      : null;

    return alunoDaMatricula || alunos[0] || null;
  }, [alunos, matricula]);

  const loadAlunos = useCallback(async () => {
    setAlunosError('');
    try {
      const data = await usuarioService.listAlunosVinculados();
      setAlunos(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message || 'Falha ao carregar alunos vinculados.'
          : 'Falha ao carregar alunos vinculados.';
      setAlunosError(msg);
    } finally {
      setLoadingAlunos(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAlunos();
  }, [loadAlunos]);

  async function handleSaveProfile() {
    if (savingProfile || !hasProfileChanges) return;

    const nomeTrimmed = nome.trim();
    const telefoneDigits = digitsOnly(telefone);

    if (nomeTrimmed.length < 2) {
      setProfileError('Informe um nome com pelo menos 2 caracteres.');
      return;
    }

    if (telefoneDigits && telefoneDigits.length < 8) {
      setProfileError('Telefone invalido. Informe ao menos 8 digitos.');
      return;
    }

    setSavingProfile(true);
    setProfileError('');
    setProfileMessage('');

    const payload = {
      nome: nomeTrimmed,
      telefone: telefoneDigits || undefined,
    };

    try {
      await usuarioService.updateProfile(payload);
      await refreshProfile();
      invalidate('usuario');
      setProfileMessage('Perfil atualizado com sucesso.');
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message || 'Nao foi possivel atualizar o perfil.'
          : 'Nao foi possivel atualizar o perfil.';
      setProfileError(msg);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleRecalcularPerfilLeitura() {
    if (recalculatingPerfil || !alunoSelecionado) return;

    const alunoId = Number(alunoSelecionado.id);
    if (!Number.isInteger(alunoId)) {
      setPerfilLeituraError('Nenhum aluno valido foi encontrado para recalcular o perfil.');
      return;
    }

    setRecalculatingPerfil(true);
    setPerfilLeituraError('');
    setPerfilLeituraMessage('');
    setPerfilLeituraResult(null);

    try {
      const result = await assistenteService.recalcularPerfilLeitura(alunoId);
      setPerfilLeituraResult(result);
      setPerfilLeituraMessage('Perfil de leitura recalculado com sucesso.');
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message || 'Nao foi possivel recalcular o perfil de leitura.'
          : 'Nao foi possivel recalcular o perfil de leitura.';
      setPerfilLeituraError(msg);
    } finally {
      setRecalculatingPerfil(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadAlunos();
            }}
            tintColor="#0292B7"
          />
        }
      >
        <Text style={styles.title}>Perfil</Text>
        <Text style={styles.subtitle}>Atualize seus dados e gerencie alunos vinculados</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Seus dados</Text>

          <Text style={styles.label}>Nome</Text>
          <TextInput
            value={nome}
            onChangeText={setNome}
            autoCapitalize="words"
            placeholder="Seu nome"
            placeholderTextColor="#B8B2A8"
            style={styles.input}
            editable={!savingProfile}
          />

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            value={user?.email || ''}
            editable={false}
            style={[styles.input, styles.inputDisabled]}
            placeholder="-"
            placeholderTextColor="#B8B2A8"
          />

          <Text style={styles.label}>Telefone</Text>
          <TextInput
            value={telefone}
            onChangeText={(value) => setTelefone(formatPhone(value))}
            keyboardType="phone-pad"
            placeholder="(11) 99999-0000"
            placeholderTextColor="#B8B2A8"
            style={styles.input}
            editable={!savingProfile}
          />

          {!!profileError && <Text style={styles.errorText}>{profileError}</Text>}
          {!!profileMessage && <Text style={styles.successText}>{profileMessage}</Text>}

          <TouchableOpacity
            onPress={handleSaveProfile}
            style={[
              styles.submitBtn,
              (!hasProfileChanges || savingProfile) && styles.submitBtnDisabled,
            ]}
            activeOpacity={0.85}
            disabled={!hasProfileChanges || savingProfile}
          >
            {savingProfile ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Salvar alteracoes</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Perfil de leitura</Text>

          <TouchableOpacity
            onPress={handleRecalcularPerfilLeitura}
            style={[
              styles.aiBtn,
              (recalculatingPerfil || !alunoSelecionado) && styles.aiBtnDisabled,
            ]}
            activeOpacity={0.85}
            disabled={recalculatingPerfil || !alunoSelecionado}
          >
            {recalculatingPerfil ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.aiBtnText}>Recalcular Perfil de Leitura</Text>
            )}
          </TouchableOpacity>

          {!!perfilLeituraError && <Text style={styles.errorText}>{perfilLeituraError}</Text>}
          {!!perfilLeituraMessage && <Text style={styles.successText}>{perfilLeituraMessage}</Text>}

          {perfilLeituraResult ? (
            <View style={styles.aiResultBox}>
              <Text style={styles.aiResultText}>{formatAiResult(perfilLeituraResult)}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Aluno vinculado</Text>

          {loadingAlunos ? (
            <View style={styles.center}>
              <ActivityIndicator color="#0292B7" />
            </View>
          ) : alunosError ? (
            <Text style={styles.errorText}>{alunosError}</Text>
          ) : alunos.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum aluno vinculado.</Text>
          ) : (
            alunos.map((aluno) => (
              <View key={aluno.id ?? aluno.matricula} style={styles.alunoRow}>
                <View style={styles.alunoInfoCol}>
                  <Text style={styles.alunoNome}>{aluno.nome || 'Aluno'}</Text>
                  <Text style={styles.alunoMeta}>RA {aluno.matricula}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F2EB',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 44,
  },
  title: {
    fontFamily: 'KoHo_700Bold',
    fontSize: 24,
    color: '#1A1A1A',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 16,
    fontFamily: 'KoHo_400Regular',
    fontSize: 13,
    color: '#6A6A6A',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontFamily: 'KoHo_700Bold',
    fontSize: 16,
    color: '#036C87',
    marginBottom: 12,
  },
  label: {
    fontFamily: 'KoHo_500Medium',
    fontSize: 13,
    color: '#555555',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E4DFD5',
    borderRadius: 12,
    backgroundColor: '#FCFBF8',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'KoHo_400Regular',
    fontSize: 14,
    color: '#222222',
    marginBottom: 12,
  },
  inputDisabled: {
    backgroundColor: '#F3F2EE',
    color: '#777777',
  },
  submitBtn: {
    marginTop: 2,
    borderRadius: 12,
    backgroundColor: '#0292B7',
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontFamily: 'KoHo_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  helperText: {
    marginBottom: 12,
    fontFamily: 'KoHo_400Regular',
    fontSize: 12,
    color: '#6A6A6A',
  },
  aiBtn: {
    borderRadius: 12,
    backgroundColor: '#036C87',
    minHeight: 42,
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
  aiResultBox: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8ECF2',
    backgroundColor: '#F5FAFC',
    padding: 12,
  },
  aiResultText: {
    fontFamily: 'KoHo_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: '#1A1A1A',
  },
  errorText: {
    marginBottom: 8,
    fontFamily: 'KoHo_500Medium',
    color: '#B43D35',
    fontSize: 13,
  },
  successText: {
    marginBottom: 8,
    fontFamily: 'KoHo_500Medium',
    color: '#2F885B',
    fontSize: 13,
  },
  raRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputFlex: {
    flex: 1,
    marginBottom: 0,
  },
  verifyBtn: {
    borderWidth: 1,
    borderColor: '#CFEAF0',
    borderRadius: 10,
    backgroundColor: '#F3FCFE',
    paddingHorizontal: 12,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnDisabled: {
    opacity: 0.55,
  },
  verifyText: {
    fontFamily: 'KoHo_600SemiBold',
    fontSize: 13,
    color: '#036C87',
  },
  raInfoBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#DDEEEB',
    borderRadius: 12,
    backgroundColor: '#F5FAF8',
    padding: 12,
  },
  raInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  raInfoTitle: {
    fontFamily: 'KoHo_600SemiBold',
    color: '#036C87',
    fontSize: 13,
  },
  raInfoText: {
    marginTop: 6,
    fontFamily: 'KoHo_600SemiBold',
    color: '#1A1A1A',
    fontSize: 14,
  },
  raInfoSubText: {
    marginTop: 1,
    fontFamily: 'KoHo_400Regular',
    color: '#666666',
    fontSize: 12,
  },
  linkBtn: {
    marginTop: 10,
    borderRadius: 10,
    minHeight: 38,
    backgroundColor: '#2F885B',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  linkBtnDisabled: {
    opacity: 0.6,
  },
  linkBtnText: {
    fontFamily: 'KoHo_600SemiBold',
    color: '#FFFFFF',
    fontSize: 13,
  },
  center: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'KoHo_400Regular',
    color: '#777777',
    fontSize: 13,
  },
  alunoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EFEAE0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: '#FFFEFC',
  },
  alunoInfoCol: {
    flex: 1,
    paddingRight: 8,
  },
  alunoNome: {
    fontFamily: 'KoHo_600SemiBold',
    color: '#1A1A1A',
    fontSize: 14,
  },
  alunoMeta: {
    marginTop: 2,
    fontFamily: 'KoHo_400Regular',
    color: '#777777',
    fontSize: 12,
  },
  unlinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#F0CFCB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#FCF1F0',
  },
  unlinkText: {
    fontFamily: 'KoHo_600SemiBold',
    color: '#B43D35',
    fontSize: 12,
  },
});