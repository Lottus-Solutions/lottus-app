import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Text,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SvgUri } from 'react-native-svg';
import { Asset } from 'expo-asset';
import { useRouter } from 'expo-router';
import { ChevronLeft, User, LogOut } from 'lucide-react-native';

import { useAuth } from '../src/context/AuthContext';

function formatPhone(raw) {
  if (!raw) return '-';
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return raw;
}

export default function Header({ showBack = false }) {
  const router = useRouter();
  const { user, matricula, logout } = useAuth();
  const logoSource = require('../assets/logo_lottus.svg');
  const logoUri = Asset.fromModule(logoSource).uri;
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const matriculaAluno =
    matricula || user?.matriculasAlunos?.[0] || '-';

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      setIsProfileMenuOpen(false);
      router.replace('/login');
    } catch (e) {
      if (Platform.OS !== 'web') {
        Alert.alert('Sair', 'Nao foi possivel sair da conta agora.');
      }
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
      <View style={styles.container}>
        {showBack ? (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#0292B7" />
          </TouchableOpacity>
        ) : (
          <View style={styles.logoWrapper}>
            <SvgUri uri={logoUri} width={80} height={32} style={styles.logo} />
          </View>
        )}

        <TouchableOpacity
          style={styles.profileBtn}
          activeOpacity={0.8}
          onPress={() => setIsProfileMenuOpen(true)}
        >
          <User size={18} color="#0292B7" />
        </TouchableOpacity>
      </View>

      <Modal
        transparent
        visible={isProfileMenuOpen}
        animationType="fade"
        onRequestClose={() => setIsProfileMenuOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsProfileMenuOpen(false)}
        >
          <Pressable style={styles.menuCard} onPress={() => {}}>
            <Text style={styles.menuTitle}>Perfil</Text>

            <View style={styles.infoGroup}>
              <Text style={styles.infoLabel}>Nome</Text>
              <Text style={styles.infoValue}>{user?.nome || '-'}</Text>
            </View>

            <View style={styles.infoGroup}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email || '-'}</Text>
            </View>

            <View style={styles.infoGroup}>
              <Text style={styles.infoLabel}>Telefone</Text>
              <Text style={styles.infoValue}>{formatPhone(user?.telefone)}</Text>
            </View>

            <View style={styles.infoGroupLast}>
              <Text style={styles.infoLabel}>Matricula do aluno</Text>
              <Text style={styles.infoValue}>{matriculaAluno}</Text>
            </View>

            <TouchableOpacity
              style={[styles.logoutBtn, loggingOut && styles.logoutBtnDisabled]}
              activeOpacity={0.8}
              onPress={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? (
                <ActivityIndicator color="#B43D35" />
              ) : (
                <>
                  <LogOut size={14} color="#B43D35" />
                  <Text style={styles.logoutText}>Sair</Text>
                </>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: '#F5F2EB',
  },
  logoWrapper: {
    height: 32,
    justifyContent: 'center',
  },
  logo: {
    width: 100,
    position: 'relative',
    right: 12,
  },
  logoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0292B7',
    opacity: 0.2,
  },
  backBtn: {
    padding: 4,
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#0292B7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    paddingTop: 105,
    paddingHorizontal: 18,
    alignItems: 'flex-end',
  },
  menuCard: {
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E3D8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  menuTitle: {
    fontFamily: 'KoHo_700Bold',
    fontSize: 16,
    color: '#036C87',
    marginBottom: 10,
  },
  infoGroup: {
    marginBottom: 10,
  },
  infoGroupLast: {
    marginBottom: 0,
  },
  infoLabel: {
    fontFamily: 'KoHo_500Medium',
    fontSize: 12,
    color: '#777777',
    marginBottom: 2,
  },
  infoValue: {
    fontFamily: 'KoHo_600SemiBold',
    fontSize: 14,
    color: '#1A1A1A',
  },
  logoutBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#F0CFCB',
    borderRadius: 10,
    paddingVertical: 8,
    backgroundColor: '#FCF1F0',
  },
  logoutBtnDisabled: { opacity: 0.6 },
  logoutText: {
    fontFamily: 'KoHo_600SemiBold',
    fontSize: 13,
    color: '#B43D35',
  },
});
