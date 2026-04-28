import {
  ArrowRight,
  CircleStop,
  Mic,
  Pause,
  Play,
  Trash2,
} from 'lucide-react-native';
import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

function formatDuration(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
}

export default function ChatComposer({
  inputText,
  onChangeText,
  onSend,
  isLoading,
  isRecording,
  recordingTime,
  audioUri,
  isPreviewPlaying,
  onStartRecording,
  onStopRecording,
  onCancelAudio,
  onTogglePreview,
}) {
  const canSend = !isLoading && (!!inputText.trim() || !!audioUri) && !isRecording;

  return (
    <View style={styles.wrapper}>
      {isRecording ? (
        <View style={styles.recordingBox}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingLabel}>Gravando...</Text>
          <Text style={styles.recordingTime}>{formatDuration(recordingTime)}</Text>
          <TouchableOpacity style={styles.stopButton} onPress={onStopRecording}>
            <CircleStop size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : null}

      {!isRecording && audioUri ? (
        <View style={styles.previewBox}>
          <Text style={styles.previewTitle}>Audio pronto para envio</Text>
          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.previewAction} onPress={onTogglePreview}>
              {isPreviewPlaying ? (
                <Pause size={14} color="#0292B7" />
              ) : (
                <Play size={14} color="#0292B7" />
              )}
              <Text style={styles.previewActionText}>
                {isPreviewPlaying ? 'Pausar' : 'Ouvir'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.previewAction} onPress={onCancelAudio}>
              <Trash2 size={14} color="#B32E2E" />
              <Text style={[styles.previewActionText, styles.previewDelete]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <View style={styles.inputContainer}>
        <TextInput
          value={inputText}
          onChangeText={onChangeText}
          placeholder="Digite sua mensagem..."
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          multiline
          maxLength={500}
          editable={!isLoading && !isRecording}
        />

        {!audioUri ? (
          <TouchableOpacity
            onPress={isRecording ? onStopRecording : onStartRecording}
            style={[styles.micBtn, isRecording && styles.micBtnActive]}
            disabled={isLoading}
          >
            <Mic size={16} color="#FFFFFF" />
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          onPress={onSend}
          disabled={!canSend}
          style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
        >
          <ArrowRight size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  recordingBox: {
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E7E7',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DC2626',
  },
  recordingLabel: {
    fontFamily: 'KoHo_600SemiBold',
    color: '#1A1A1A',
    fontSize: 13,
  },
  recordingTime: {
    marginLeft: 'auto',
    fontFamily: 'KoHo_600SemiBold',
    color: '#0292B7',
    fontSize: 13,
  },
  stopButton: {
    marginLeft: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBox: {
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8ECF2',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  previewTitle: {
    fontFamily: 'KoHo_600SemiBold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  previewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewActionText: {
    fontFamily: 'KoHo_600SemiBold',
    color: '#0292B7',
  },
  previewDelete: {
    color: '#B32E2E',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: 'KoHo_400Regular',
    fontSize: 14,
    color: '#1A1A1A',
    minHeight: 20,
    maxHeight: 120,
    paddingVertical: 6,
  },
  micBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0EA5B9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: '#DC2626',
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0292B7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.35,
  },
});
