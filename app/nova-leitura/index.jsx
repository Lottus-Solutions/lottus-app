import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

function ScannerArea() {
  return (
    <View style={styles.scannerContainer}>
      {/* Cantos do scanner */}
      <View style={[styles.corner, styles.topLeft]} />
      <View style={[styles.corner, styles.topRight]} />
      <View style={[styles.corner, styles.bottomLeft]} />
      <View style={[styles.corner, styles.bottomRight]} />
      {/* Linha de scan */}
      <View style={styles.scanLine} />
    </View>
  );
}

export default function NovaLeituraScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      {/* Título */}
      <View style={styles.titleBlock}>
        <Text style={styles.title}>Nova leitura</Text>
        <Text style={styles.subtitle}>
          Escaneie o código ISBN / código de barras do livro desejado
        </Text>
      </View>

      {/* Área do scanner */}
      <ScannerArea />

      {/* Inserir manualmente */}
      <View style={styles.manualContainer}>
        <TouchableOpacity style={styles.manualBtn} activeOpacity={0.7}>
          <Text style={styles.manualText}>Inserir ISBN manualmente</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F2EB',
  },

  // Título
  titleBlock: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 13,
    color: '#999999',
    marginTop: 4,
  },

  // Scanner
  scannerContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 16,
    backgroundColor: '#E8E4DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#0292B7',
    borderWidth: 2,
  },
  topLeft: {
    top: 16,
    left: 16,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 4,
  },
  topRight: {
    top: 16,
    right: 16,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 4,
  },
  bottomLeft: {
    bottom: 16,
    left: 16,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
  },
  bottomRight: {
    bottom: 16,
    right: 16,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 4,
  },
  scanLine: {
    width: '70%',
    height: 1,
    backgroundColor: '#0292B7',
    opacity: 0.4,
  },

  // Manual
  manualContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0DDD6',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  manualBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  manualText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555555',
  },
});