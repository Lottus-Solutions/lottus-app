import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Asset } from 'expo-asset';
import { SvgUri } from 'react-native-svg';
import { Link, useRouter } from 'expo-router';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function LoginScreen() {
  const router = useRouter();
  const logoSource = require('../../assets/logo_lottus.svg');
  const logoUri = Asset.fromModule(logoSource).uri;
  const [form, setForm] = useState({
    email: '',
    senha: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!form.email.trim() || !form.senha.trim()) {
      return 'Preencha e-mail e senha para continuar.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return 'Informe um e-mail valido.';
    }

    return '';
  };

  const handleLogin = async () => {
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        email: form.email.trim().toLowerCase(),
        senha: form.senha,
      };

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Falha no login. Verifique suas credenciais.');
      }

      router.replace('/visao-geral');
    } catch (requestError) {
      setError(requestError.message || 'Nao foi possivel realizar o login agora.');
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
        <View style={styles.container}>
          <View style={styles.heroCard}>
            <SvgUri uri={logoUri} width={120} height={48} style={styles.logo} />
            <Text style={styles.title}>Seja bem-vindo!</Text>
            <Text style={styles.subtitle}>Gerencie a biblioteca do seu filho de qualquer lugar</Text>
          </View>

          <View style={styles.formCard}>
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
            />

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              onPress={handleLogin}
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Entrar</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Ainda nao tem conta?</Text>
            <Link href="/cadastro" asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.footerLink}>Criar cadastro</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
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
  container: {
    flex: 1,
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
    color: '#45727E',
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
