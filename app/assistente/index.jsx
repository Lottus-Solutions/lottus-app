import {
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import ChatComposer from './components/ChatComposer';
import ChatMessageList from './components/ChatMessageList';
import { useAuth } from '../../src/context/AuthContext';
import assistenteService from '../../src/services/assistenteService';
import usuarioService from '../../src/services/usuarioService';


function createMessage({ role, text = '', type = 'text' }) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role,
    text,
    type,
  };
}

function getFriendlyErrorMessage(error) {
  if (!error) return 'Nao foi possivel completar sua solicitacao.';

  const message = String(error.message || '').toLowerCase();
  if (message.includes('network request failed') || message.includes('failed to fetch')) {
    return 'Sem conexao com o servidor. Verifique a rede e tente novamente.';
  }
  if (message.includes('timeout')) {
    return 'A resposta da IA demorou demais. Tente novamente em instantes.';
  }
  if (message.includes('permission')) {
    return 'Permissao de microfone negada. Ative nas configuracoes para gravar audio.';
  }

  return error.message || 'Erro inesperado ao falar com o assistente.';
}

export default function AssistenteScreen() {
  const { matricula } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUri, setAudioUri] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedAlunoId, setSelectedAlunoId] = useState(null);
  const [userName, setUserName] = useState('');

  const scrollViewRef = useRef(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const audioPlayer = useAudioPlayer(audioUri || null);
  const playerStatus = useAudioPlayerStatus(audioPlayer);

  const resolvedAlunoId = useMemo(
    () => selectedAlunoId,
    [selectedAlunoId]
  );

  useEffect(() => {
    (async () => {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
    })();
  }, []);

  useEffect(() => {
    if (!audioUri) return;
    audioPlayer.pause();
    audioPlayer.seekTo(0).catch(() => null);
  }, [audioPlayer, audioUri]);

  useEffect(() => {
    setIsRecording(!!recorderState?.isRecording);
    setRecordingTime(Math.floor((recorderState?.durationMillis || 0) / 1000));
  }, [recorderState]);

  useEffect(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isLoading]);

  useEffect(() => {
    let cancelled = false;

    async function resolveUserName() {
      try {
        const profile = await usuarioService.getProfile();
        if (cancelled) return;

        const name = String(profile?.nome || profile?.name || '').trim();
        setUserName(name || 'Estudante');
      } catch {
        if (!cancelled) {
          setUserName('Estudante');
        }
      }
    }

    async function resolveAlunoId() {
      try {
        const alunos = await usuarioService.listAlunosVinculados();
        if (cancelled || !Array.isArray(alunos) || !alunos.length) return;

        const selectedByMatricula = matricula
          ? alunos.find((aluno) => String(aluno?.matricula) === String(matricula))
          : null;

        const fallback = selectedByMatricula || alunos[0];
        const id = Number(fallback?.id);
        if (!cancelled && Number.isFinite(id)) {
          setSelectedAlunoId(id);
        }
      } catch {
        // Mantem fallback para DEFAULT_ALUNO_ID quando nao for possivel resolver aluno.
      }
    }

    resolveUserName();
    resolveAlunoId();

    return () => {
      cancelled = true;
    };
  }, [matricula]);

  const requestPermission = useCallback(async () => {
    const permission = await requestRecordingPermissionsAsync();
    const granted = !!permission?.granted;
    setPermissionGranted(granted);
    return granted;
  }, []);

  const handleStartRecording = useCallback(async () => {
    try {
      setErrorMessage('');

      const granted = permissionGranted || (await requestPermission());
      if (!granted) {
        setErrorMessage('Permissao de microfone negada. Ative nas configuracoes.');
        return;
      }

      setAudioUri(null);
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (error) {
      setErrorMessage(getFriendlyErrorMessage(error));
    }
  }, [permissionGranted, recorder, requestPermission]);

  const handleStopRecording = useCallback(async () => {
    try {
      await recorder.stop();
      const uri = recorder.uri || recorderState?.url || null;
      if (!uri) {
        setErrorMessage('Nao foi possivel finalizar a gravacao. Tente novamente.');
        return;
      }

      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo?.exists) {
        setErrorMessage('Audio gravado nao encontrado no dispositivo.');
        return;
      }

      setAudioUri(uri);
    } catch (error) {
      setErrorMessage(getFriendlyErrorMessage(error));
    }
  }, [recorder, recorderState]);

  const handleCancelAudio = useCallback(() => {
    audioPlayer.pause();
    setAudioUri(null);
    setRecordingTime(0);
  }, [audioPlayer]);

  const handleTogglePreview = useCallback(() => {
    if (!audioUri) return;

    if (playerStatus?.playing) {
      audioPlayer.pause();
      return;
    }

    audioPlayer.play();
  }, [audioPlayer, audioUri, playerStatus?.playing]);

  const handleSend = useCallback(async () => {
    if (isLoading || isRecording) return;

    const text = inputText.trim();
    const hasAudio = !!audioUri;
    if (!text && !hasAudio) return;

    setErrorMessage('');

    const userMessage = createMessage({
      role: 'user',
      text,
      type: hasAudio ? 'audio' : 'text',
    });

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setAudioUri(null);
    setIsLoading(true);
    Keyboard.dismiss();

    try {
      const response = await assistenteService.enviarMensagemReforco({
        alunoId: resolvedAlunoId,
        texto: text,
        audioUri,
      });

      const aiText = response?.texto?.trim() ||
        'Recebi sua mensagem. Pode me contar mais detalhes para eu te orientar melhor?';

      setMessages((prev) => [
        ...prev,
        createMessage({ role: 'assistant', text: aiText, type: 'text' }),
      ]);
    } catch (error) {
      const friendlyMessage = getFriendlyErrorMessage(error);
      setErrorMessage(friendlyMessage);
      setMessages((prev) => [
        ...prev,
        createMessage({ role: 'assistant', text: friendlyMessage, type: 'text' }),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [audioUri, inputText, isLoading, isRecording, resolvedAlunoId]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
        >
          {errorMessage ? <Text style={styles.errorBanner}>{errorMessage}</Text> : null}

          <ChatMessageList
            scrollViewRef={scrollViewRef}
            messages={messages}
            isLoading={isLoading}
            userName={userName || 'Estudante'}
          />

          <ChatComposer
            inputText={inputText}
            onChangeText={setInputText}
            onSend={handleSend}
            isLoading={isLoading}
            isRecording={isRecording}
            recordingTime={recordingTime}
            audioUri={audioUri}
            isPreviewPlaying={!!playerStatus?.playing}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onCancelAudio={handleCancelAudio}
            onTogglePreview={handleTogglePreview}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F2EB' },
  flex: { flex: 1 },
  errorBanner: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 2,
    borderRadius: 10,
    backgroundColor: '#FDEBEC',
    color: '#8F2130',
    borderWidth: 1,
    borderColor: '#F5C2C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: 'KoHo_400Regular',
    fontSize: 13,
  },
});