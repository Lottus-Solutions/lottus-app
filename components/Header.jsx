import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { Asset } from 'expo-asset';
import { useRouter } from 'expo-router';
import { ChevronLeft, User } from 'lucide-react-native';

export default function Header({ showBack = false }) {
  const router = useRouter();
  const logoSource = require('../assets/logo_lottus.svg');
  const logoUri = Asset.fromModule(logoSource).uri;

  return (
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

      <TouchableOpacity style={styles.profileBtn}>
        <User size={18} color="#0292B7" />
      </TouchableOpacity>
    </View>
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
});