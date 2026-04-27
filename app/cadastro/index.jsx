import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Asset } from 'expo-asset';
import { SvgUri } from 'react-native-svg';
import { Link, useRouter } from 'expo-router';

import { useAuth } from '../../src/context/AuthContext';
import { ApiError } from '../../src/api/client';
import alunoService from '../../src/services/alunoService';

export default function CadastroScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const logoSource = require('../../assets/logo_lottus.svg');
  const logoUri = Asset.fromModule(logoSource).uri;

  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    matriculaAluno: '',
  });
  const [alunoInfo, setAlunoInfo] = useState(null); // resultado do verificar-ra
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'matriculaAluno') setAlunoInfo(null);
  };

  const validate = () => {
    if (
      !form.nome.trim() ||
      !form.email.trim() ||
      !form.senha.trim() ||
      !form.matriculaAluno.trim()
    ) {
      return 'Preencha todos os campos para continuar.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return 'Informe um e-mail valido.';
    }
    if (form.senha.length < 8) {
      return 'A senha precisa ter no minimo 8 caracteres.';
    }
    return '';
  };

  const handleVerificarMatricula = async () => {
    if (!form.matriculaAluno.trim()) {
      setError('Informe a matricula para verificar.');
      return;
    }
    setError('');
    setVerifying(true);
    try {
      const aluno = await alunoService.verificarMatricula(form.matriculaAluno.trim());
      setAlunoInfo(aluno);
      if (aluno?.vinculado) {
        setError('Este aluno ja possui um responsavel vinculado.');
      }
    } catch (err) {
      setAlunoInfo(null);
      const msg =
        err instanceof ApiError && err.status === 404
          ? 'Matricula nao encontrada. Confira com a escola.'
          : err instanceof ApiError
          ? err.message
          : 'Nao foi possivel verificar a matricula.';
      setError(msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleCadastro = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (alunoInfo?.vinculado) {
      setError('Este aluno ja possui um responsavel vinculado.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register({
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        senha: form.senha,
        matriculaAluno: form.matriculaAluno.trim(),
      });
      router.replace('/visao-geral');
    } catch (err) {
      let message = 'Erro ao cadastrar. Tente novamente em instantes.';
      if (err instanceof ApiError) {
        if (err.status === 404) message = 'Matricula nao encontrada.';
        else if (err.status === 409) message = 'E-mail ja cadastrado ou aluno ja vinculado.';
        else if (err.status === 400) message = err.message || 'Dados invalidos.';
        else if (err.message) message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroCard}>
            <SvgUri uri={logoUri} width={120} height={48} style={styles.logo} />
            <Text style={styles.title}>Seja bem-vindo!</Text>
            <Text style={styles.subtitle}>Gerencie a biblioteca do seu filho de qualquer lugar</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              value={form.nome}
              onChangeText={(value) => updateField('nome', value)}
              autoCapitalize="words"
              placeholder="Seu nome"
              placeholderTextColor="#B8B2A8"
              style={styles.input}
              editable={!loading}
            />

            <Text style={styles.label}>E-mail</Text>
            <TextInput
              value={form.email}
              onChangeText={(value) => updateField('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="seu_email@email.com"
              placeholderTextColor="#B8B2A8"
              style={styles.input}
              editable={!loading}
            />

            <Text style={styles.label}>Senha</Text>
            <TextInput
              value={form.senha}
              onChangeText={(value) => updateField('senha', value)}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="senhaSegura123"
              placeholderTextColor="#B8B2A8"
              style={styles.input}
              editable={!loading}
            />

            <Text style={styles.label}>Matricula do aluno</Text>
            <View style={styles.matriculaRow}>
              <TextInput
                value={form.matriculaAluno}
                onChangeText={(value) => updateField('matriculaAluno', value)}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="00000000"
                placeholderTextColor="#B8B2A8"
                style={[styles.input, styles.inputFlex]}
                editable={!loading && !verifying}
              />
              <TouchableOpacity
                style={[styles.verifyBtn, (verifying || !form.matriculaAluno) && styles.verifyBtnDisabled]}
                onPress={handleVerificarMatricula}
                disabled={verifying || !form.matriculaAluno}
                activeOpacity={0.85}
              >
                {verifying ? (
                  <ActivityIndicator color="#0292B7" />
                ) : (
                  <Text style={styles.verifyText}>Verificar</Text>
                )}
              </TouchableOpacity>
            </View>

            {alunoInfo && !alunoInfo.vinculado && (
              <View style={styles.alunoInfoOk}>
                <Text style={styles.alunoInfoText}>
                  Aluno encontrado: <Text style={{ fontFamily: 'KoHo_600SemiBold' }}>{alunoInfo.nome}</Text>
                  {alunoInfo.serie ? ` - ${alunoInfo.serie}` : ''}
                </Text>
              </View>
            )}

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              onPress={handleCadastro}
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Cadastrar</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Ja possui conta?</Text>
            <Link href="/login" asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.footerLink}>Entrar</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F2EB',
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  heroCard: {
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 16,
    alignItems: 'center',
  },
  logo: {
    marginBottom: 10,
  },
  title: {
    fontFamily: 'KoHo_700Bold',
    fontSize: 30,
    color: '#036C87',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'KoHo_400Regular',
    fontSize: 14,
    color: '#036C87',
    marginTop: 6,
    lineHeight: 20,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    fontFamily: 'KoHo_400Regular',
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FFFEFB',
  },
  matriculaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  inputFlex: { flex: 1 },
  verifyBtn: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0292B7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  verifyBtnDisabled: { opacity: 0.5 },
  verifyText: { fontFamily: 'KoHo_600SemiBold', fontSize: 13, color: '#0292B7' },
  alunoInfoOk: {
    backgroundColor: '#E6F6F1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  alunoInfoText: {
    fontFamily: 'KoHo_400Regular',
    fontSize: 13,
    color: '#2E7D4F',
  },
  errorText: {
    fontFamily: 'KoHo_500Medium',
    fontSize: 12,
    color: '#B43D35',
    marginBottom: 10,
  },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0292B7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontFamily: 'KoHo_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  footerRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  footerText: {
    fontFamily: 'KoHo_400Regular',
    fontSize: 14,
    color: '#6C6A66',
  },
  footerLink: {
    fontFamily: 'KoHo_600SemiBold',
    fontSize: 14,
    color: '#0292B7',
  },
});
