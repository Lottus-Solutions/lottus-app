import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, User } from 'lucide-react-native';

export default function Header({ showBack = false }) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {showBack ? (
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#0292B7" />
        </TouchableOpacity>
      ) : (
        <View style={styles.logoWrapper}>

          <Image source={"./logo_lottus.svg"} style={styles.logo} resizeMode="contain" />

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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#F5F2EB',
  },
  logoWrapper: {
    height: 32,
    justifyContent: 'center',
  },
  logo: {
    width: 80,
    height: 32,
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