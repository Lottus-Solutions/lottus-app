import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, BookOpen, ScanLine, X } from 'lucide-react-native';

import { useAuth } from '../../src/context/AuthContext';
import { useDataSync } from '../../src/context/DataSyncContext';
import livroService from '../../src/services/livroService';
import emprestimoService from '../../src/services/emprestimoService';
import { ApiError } from '../../src/api/client';

/**
 * expo-camera é importado de forma resiliente:
 * - Em web, o módulo existe mas a leitura de barcode não é confiável.
 * - Se o pacote não estiver instalado (usuário ainda não rodou expo install),
 *   o botão de scanner mostra mensagem em vez de quebrar o app.
 */
let CameraView = null;
let useCameraPermissions = null;
try {
  // eslint-disable-next-line global-require
  const cam = require('expo-camera');
  CameraView = cam.CameraView;
  useCameraPermissions = cam.useCameraPermissions;
} catch (e) {
  CameraView = null;
}

const SCANNER_DISPONIVEL = !!CameraView && Platform.OS !== 'web';
const LIVROS_POR_PAGINA = 20;

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* -------------------------------------------------------------------------- */
/* Modal do Scanner                                                            */
/* -------------------------------------------------------------------------- */

function ScannerModal({ visible, onClose, onDetect }) {
  const [permission, requestPermission] = useCameraPermissions
    ? useCameraPermissions()
    : [{ granted: false }, async () => ({ granted: false })];
  const [scanned, setScanned] = useState(false);
  const [ocrRunning, setOcrRunning] = useState(false);
  const lastDataRef = useRef(null);
  const cameraRef = useRef(null);

  // Reseta o estado de "escaneado" sempre que reabrir.
  useEffect(() => {
    if (visible) {
      setScanned(false);
      lastDataRef.current = null;
    }
  }, [visible]);

  const handleBarcode = ({ data, type }) => {
    if (scanned || !data) return;
    // Evita disparar duas vezes o mesmo código rapidamente.
    if (lastDataRef.current === data) return;
    lastDataRef.current = data;
    setScanned(true);
    onDetect({ data, type });
  };

  const handleOcrCapture = async () => {
    if (!cameraRef.current || ocrRunning) return;

    setOcrRunning(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.55,
        skipProcessing: true,
      });
      const resultado = await livroService.extrairIsbnViaOcr(photo?.uri);

      if (!resultado?.isbn) {
        Alert.alert(
          'OCR sem ISBN',
          'A imagem foi lida, mas não encontramos um ISBN válido. Tente aproximar a capa ou a contracapa.'
        );
        return;
      }

      lastDataRef.current = resultado.isbn;
      setScanned(true);
      onDetect({ data: resultado.isbn, type: 'ocr', ocrText: resultado.texto });
    } catch (error) {
      Alert.alert('OCR', 'Falha ao reconhecer o texto da imagem.');
    } finally {
      setOcrRunning(false);
    }
  };

  const showRequest = visible && (!permission || !permission.granted);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={scannerStyles.root}>
        {/* Header */}
        <View style={scannerStyles.header}>
          <Text style={scannerStyles.headerTitle}>Escanear ISBN</Text>
          <TouchableOpacity onPress={onClose} style={scannerStyles.closeBtn}>
            <X size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Conteúdo: câmera ou pedido de permissão */}
        {showRequest ? (
          <View style={scannerStyles.permissionWrap}>
            <Text style={scannerStyles.permissionText}>
              Precisamos de acesso à câmera para escanear o código de barras.
            </Text>
            <TouchableOpacity
              style={scannerStyles.permissionBtn}
              activeOpacity={0.85}
              onPress={async () => {
                if (requestPermission) await requestPermission();
              }}
            >
              <Text style={scannerStyles.permissionBtnText}>Permitir câmera</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={scannerStyles.permissionLink}>
              <Text style={scannerStyles.permissionLinkText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        ) : visible && CameraView ? (
          <View style={scannerStyles.cameraWrap}>
            <CameraView
              ref={cameraRef}
              style={scannerStyles.camera}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarcode}
            />
            {/* Overlay com cantos */}
            <View pointerEvents="none" style={scannerStyles.overlay}>
              <View style={[scannerStyles.corner, scannerStyles.tl]} />
              <View style={[scannerStyles.corner, scannerStyles.tr]} />
              <View style={[scannerStyles.corner, scannerStyles.bl]} />
              <View style={[scannerStyles.corner, scannerStyles.br]} />
            </View>
            <View style={scannerStyles.hintBox}>
              <Text style={scannerStyles.hintText}>
                Aponte para o código de barras ou capture a capa para OCR
              </Text>
            </View>
            <TouchableOpacity
              style={[scannerStyles.ocrBtn, ocrRunning && scannerStyles.ocrBtnDisabled]}
              activeOpacity={0.85}
              onPress={handleOcrCapture}
              disabled={ocrRunning}
            >
              {ocrRunning ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={scannerStyles.ocrBtnText}>Capturar e reconhecer ISBN</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Tela principal                                                              */
/* -------------------------------------------------------------------------- */

export default function NovaLeituraScreen() {
  const router = useRouter();
  const { matricula } = useAuth();
  const { invalidate } = useDataSync();
  const requestIdRef = useRef(0);

  const [busca, setBusca] = useState('');
  const debouncedBusca = useDebounce(busca, 400);
  const [livros, setLivros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [temMais, setTemMais] = useState(true);
  const [error, setError] = useState(null);
  const [registrando, setRegistrando] = useState(null); // id do livro em registro
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerStatus, setScannerStatus] = useState(null); // 'searching' | 'notfound' | null
  const [isbnDetectado, setIsbnDetectado] = useState(null);
  const [livroGoogle, setLivroGoogle] = useState(null);
  const [ocrResumo, setOcrResumo] = useState(null);

  const carregarPagina = async ({ page, replace = false, buscaTerm }) => {
    const requestId = ++requestIdRef.current;
    if (replace) setLoading(true);
    else setLoadingMore(true);

    setError(null);

    try {
      const result = await livroService.listLivros({
        busca: buscaTerm,
        page,
        size: LIVROS_POR_PAGINA,
        sort: 'titulo,asc',
      });

      if (requestId !== requestIdRef.current) return;

      const content = result?.content ?? [];
      setLivros((current) => (replace ? content : [...current, ...content]));
      setPaginaAtual(page);
      setTemMais(Boolean(result && !result.last && content.length > 0));
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      const msg =
        err instanceof ApiError
          ? err.message || 'Falha ao buscar livros.'
          : 'Erro de conexão.';
      setError(msg);
      if (replace) setLivros([]);
      setTemMais(false);
    } finally {
      if (requestId !== requestIdRef.current) return;
      if (replace) setLoading(false);
      else setLoadingMore(false);
    }
  };

  /* Listagem por busca textual */
  useEffect(() => {
    const buscaTerm = debouncedBusca?.trim() || undefined;
    setPaginaAtual(0);
    setTemMais(true);
    setLivros([]);
    carregarPagina({ page: 0, replace: true, buscaTerm });
    return () => {
      requestIdRef.current += 1;
    };
  }, [debouncedBusca]);

  const carregarMais = async () => {
    if (loading || loadingMore || !temMais) return;

    const buscaTerm = debouncedBusca?.trim() || undefined;
    await carregarPagina({
      page: paginaAtual + 1,
      replace: false,
      buscaTerm,
    });
  };

  const handleRegistrar = async (livro) => {
    if (!matricula) {
      const msg = 'Selecione um aluno antes de registrar leitura.';
      if (Platform.OS !== 'web') Alert.alert('Nova leitura', msg);
      setError(msg);
      return;
    }
    setRegistrando(livro.id);
    setError(null);
    try {
      await emprestimoService.registrarLeitura(matricula, { livroId: livro.id });
      invalidate(['emprestimos', 'alunos', 'metas']);
      router.back();
    } catch (err) {
      let msg = 'Não foi possível registrar a leitura.';
      if (err instanceof ApiError) {
        if (err.status === 409) msg = 'Este aluno já possui uma leitura em andamento.';
        else if (err.status === 403) msg = 'Aluno não vinculado ao seu cadastro.';
        else if (err.status === 404) msg = 'Livro ou aluno não encontrado.';
        else if (err.message) msg = err.message;
      }
      if (Platform.OS !== 'web') Alert.alert('Nova leitura', msg);
      setError(msg);
    } finally {
      setRegistrando(null);
    }
  };

  /* Callback quando o scanner detecta um código */
  const handleScannerDetect = async ({ data, type, ocrText }) => {
    const isbn = livroService.normalizarIsbn(data);
    if (!isbn) {
      setScannerStatus('notfound');
      setScannerOpen(false);
      if (Platform.OS !== 'web') Alert.alert('Scanner', 'Não foi possível identificar um ISBN válido.');
      return;
    }

    setIsbnDetectado(isbn);
    setLivroGoogle(null);
  setOcrResumo(type === 'ocr' ? (ocrText || 'Texto reconhecido pela câmera.') : null);
    setScannerStatus('searching');
    try {
      const livro = await livroService.buscarPorIsbn(isbn);
      if (!livro) {
        setScannerStatus('searching');
        const googleLivro = await livroService.buscarNoGooglePorIsbn(isbn);

        if (!googleLivro) {
          setScannerStatus('notfound');
          if (Platform.OS !== 'web') {
            Alert.alert(
              'ISBN identificado',
              `ISBN ${isbn} foi lido, mas não encontramos o livro no acervo nem no Google Books.`,
              [{ text: 'OK', onPress: () => setScannerOpen(false) }]
            );
          } else {
            setScannerOpen(false);
          }
          setScannerStatus(null);
          return;
        }

        setLivroGoogle(googleLivro);
        setScannerOpen(false);
        setScannerStatus(null);
        if (Platform.OS !== 'web') {
          Alert.alert(
            'ISBN identificado no Google Books',
            [
              googleLivro.titulo,
              googleLivro.autor,
              googleLivro.editora ? `Editora: ${googleLivro.editora}` : null,
              `ISBN: ${googleLivro.isbn}`,
            ]
              .filter(Boolean)
              .join('\n'),
            [{ text: 'OK' }]
          );
        }
        return;
      }
      // Encontrou: pergunta confirmação antes de registrar.
      setScannerOpen(false);
      setScannerStatus(null);
      if (Platform.OS === 'web') {
        await handleRegistrar(livro);
        return;
      }
      Alert.alert(
        'Livro encontrado',
        `${livro.titulo}\n${livro.autor || ''}\n\nRegistrar como leitura atual?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Registrar', onPress: () => handleRegistrar(livro) },
        ]
      );
    } catch (err) {
      setScannerStatus(null);
      setScannerOpen(false);
      const msg =
        err instanceof ApiError ? err.message : 'Falha ao buscar pelo ISBN.';
      if (Platform.OS !== 'web') Alert.alert('Scanner', msg);
      setError(msg);
    }
  };

  const placeholder = useMemo(() => 'Buscar por título, autor ou ISBN', []);

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoading}>
          <ActivityIndicator color="#0292B7" />
        </View>
      );
    }

    if (livros.length === 0) return null;

    if (!temMais) {
      return <Text style={styles.footerText}>Fim dos resultados</Text>;
    }

    return (
      <TouchableOpacity style={styles.loadMoreBtn} activeOpacity={0.85} onPress={carregarMais}>
        <Text style={styles.loadMoreBtnText}>Carregar mais livros</Text>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color="#0292B7" />
        </View>
      );
    }

    return (
      <Text style={styles.empty}>
        {debouncedBusca ? 'Nenhum livro encontrado.' : 'Nenhum livro disponível.'}
      </Text>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Nova leitura</Text>
          <Text style={styles.subtitle}>
            Escaneie o código de barras ou busque o livro no acervo
          </Text>
        </View>

        {/* Botão do scanner — visível só em mobile */}
        {SCANNER_DISPONIVEL ? (
          <TouchableOpacity
            style={styles.scannerBtn}
            activeOpacity={0.85}
            onPress={() => setScannerOpen(true)}
          >
            <ScanLine size={18} color="#FFFFFF" />
            <Text style={styles.scannerBtnText}>Escanear código de barras</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.scannerWebHint}>
            <ScanLine size={14} color="#777777" />
            <Text style={styles.scannerWebHintText}>
              Scanner disponível apenas no app mobile
            </Text>
          </View>
        )}

        <View style={styles.dividerWrap}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou busque manualmente</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.searchWrap}>
          <Search size={16} color="#777777" />
          <TextInput
            style={styles.searchInput}
            value={busca}
            onChangeText={(text) => {
              setBusca(text);
              setIsbnDetectado(null);
              setLivroGoogle(null);
              setOcrResumo(null);
            }}
            placeholder={placeholder}
            placeholderTextColor="#B8B2A8"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {!!isbnDetectado && (
          <View style={styles.isbnCard}>
            <Text style={styles.isbnLabel}>ISBN detectado</Text>
            <Text style={styles.isbnValue}>{isbnDetectado}</Text>
            {ocrResumo ? (
              <Text style={styles.isbnOcrText} numberOfLines={3}>
                OCR: {ocrResumo}
              </Text>
            ) : null}
            {livroGoogle ? (
              <Text style={styles.isbnGoogleText} numberOfLines={2}>
                Google Books: {livroGoogle.titulo}
                {livroGoogle.autor ? ` · ${livroGoogle.autor}` : ''}
              </Text>
            ) : null}
          </View>
        )}

        {!!error && <Text style={styles.errorText}>{error}</Text>}
        {scannerStatus === 'searching' && (
          <Text style={styles.statusText}>Buscando ISBN no acervo e no Google Books…</Text>
        )}

        <FlatList
          style={{ flex: 1 }}
          contentContainerStyle={styles.list}
          data={livros}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item: livro }) => (
            <View style={styles.item}>
              <View style={styles.itemIcon}>
                <BookOpen size={18} color="#0292B7" />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {livro.titulo}
                </Text>
                <Text style={styles.itemMeta} numberOfLines={1}>
                  {[livro.autor, livro.categoria].filter(Boolean).join(' · ')}
                </Text>
                {!!livro.isbn && <Text style={styles.itemIsbn}>ISBN {livro.isbn}</Text>}
              </View>
              <TouchableOpacity
                style={[styles.itemBtn, registrando === livro.id && styles.itemBtnDisabled]}
                onPress={() => handleRegistrar(livro)}
                disabled={registrando !== null}
                activeOpacity={0.85}
              >
                {registrando === livro.id ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.itemBtnText}>Registrar</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={carregarMais}
          onEndReachedThreshold={0.35}
          keyboardShouldPersistTaps="handled"
        />
      </KeyboardAvoidingView>

      {SCANNER_DISPONIVEL && (
        <ScannerModal
          visible={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onDetect={handleScannerDetect}
        />
      )}
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/* Estilos                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F2EB' },
  titleBlock: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontFamily: 'KoHo_600SemiBold', fontSize: 20, color: '#1A1A1A' },
  subtitle: { fontFamily: 'KoHo_400Regular', fontSize: 13, color: '#999999', marginTop: 4 },

  scannerBtn: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#0292B7',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0292B7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  scannerBtnText: {
    fontFamily: 'KoHo_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  scannerWebHint: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0EDE6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4DFD5',
    borderStyle: 'dashed',
  },
  scannerWebHintText: {
    fontFamily: 'KoHo_500Medium',
    fontSize: 12,
    color: '#777777',
  },

  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 4,
    gap: 8,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E4DFD5' },
  dividerText: {
    fontFamily: 'KoHo_400Regular',
    fontSize: 11,
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  searchWrap: {
    marginHorizontal: 20,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E4DFD5',
  },
  searchInput: {
    flex: 1,
    fontFamily: 'KoHo_400Regular',
    fontSize: 14,
    color: '#1A1A1A',
    padding: 0,
  },

  list: { padding: 20, paddingBottom: 40 },
  center: { paddingVertical: 32, alignItems: 'center' },
  empty: {
    fontFamily: 'KoHo_400Regular',
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
    paddingTop: 20,
  },
  footerLoading: {
    paddingVertical: 14,
  },
  footerText: {
    fontFamily: 'KoHo_500Medium',
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    paddingVertical: 14,
  },
  loadMoreBtn: {
    marginTop: 4,
    marginBottom: 4,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D8D1C5',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  loadMoreBtnText: {
    fontFamily: 'KoHo_600SemiBold',
    fontSize: 13,
    color: '#0292B7',
  },
  errorText: {
    fontFamily: 'KoHo_500Medium',
    fontSize: 12,
    color: '#B43D35',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  statusText: {
    fontFamily: 'KoHo_500Medium',
    fontSize: 12,
    color: '#0292B7',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  isbnCard: {
    marginHorizontal: 20,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#EDF8FB',
    borderWidth: 1,
    borderColor: '#C9E8F0',
  },
  isbnLabel: {
    fontFamily: 'KoHo_500Medium',
    fontSize: 11,
    color: '#02708D',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  isbnValue: {
    fontFamily: 'KoHo_700Bold',
    fontSize: 14,
    color: '#1A1A1A',
    marginTop: 2,
  },
  isbnGoogleText: {
    fontFamily: 'KoHo_400Regular',
    fontSize: 12,
    color: '#05718C',
    marginTop: 4,
  },
  isbnOcrText: {
    fontFamily: 'KoHo_400Regular',
    fontSize: 12,
    color: '#4D6B73',
    marginTop: 4,
  },
  item: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E0F2F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: { flex: 1 },
  itemTitle: { fontFamily: 'KoHo_600SemiBold', fontSize: 14, color: '#1A1A1A' },
  itemMeta: { fontFamily: 'KoHo_400Regular', fontSize: 12, color: '#777777', marginTop: 2 },
  itemIsbn: { fontFamily: 'KoHo_400Regular', fontSize: 11, color: '#999999', marginTop: 1 },
  itemBtn: {
    backgroundColor: '#0292B7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    minWidth: 84,
    alignItems: 'center',
  },
  itemBtnDisabled: { opacity: 0.6 },
  itemBtnText: { fontFamily: 'KoHo_600SemiBold', fontSize: 12, color: '#FFFFFF' },
});

const scannerStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  headerTitle: { fontFamily: 'KoHo_700Bold', fontSize: 18, color: '#FFFFFF' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  cameraWrap: { flex: 1 },
  camera: { ...StyleSheet.absoluteFillObject },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderColor: '#0292B7',
    borderWidth: 3,
  },
  tl: { top: '30%', left: '12%', borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  tr: { top: '30%', right: '12%', borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  bl: { bottom: '30%', left: '12%', borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  br: { bottom: '30%', right: '12%', borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
  hintBox: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  hintText: {
    fontFamily: 'KoHo_500Medium',
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  ocrBtn: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 92,
    backgroundColor: '#0292B7',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0292B7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 5,
  },
  ocrBtnDisabled: {
    opacity: 0.7,
  },
  ocrBtnText: {
    fontFamily: 'KoHo_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  permissionWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#000000',
  },
  permissionText: {
    fontFamily: 'KoHo_500Medium',
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  permissionBtn: {
    backgroundColor: '#0292B7',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionBtnText: {
    fontFamily: 'KoHo_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  permissionLink: { marginTop: 16, padding: 8 },
  permissionLinkText: {
    fontFamily: 'KoHo_500Medium',
    fontSize: 13,
    color: '#999999',
  },
});
