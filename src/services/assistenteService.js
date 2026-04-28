const ASSISTENTE_API_URL =
  process.env.EXPO_PUBLIC_ASSISTENTE_API_URL || process.env.EXPO_PUBLIC_API_URL || '';

const ASSISTENTE_API_BASE = ASSISTENTE_API_URL.replace(/\/$/, '');
const CHAT_REFORCO_ENDPOINT = `${ASSISTENTE_API_BASE}/chat-reforco`;
const PERFIL_LEITURA_ENDPOINT = `${ASSISTENTE_API_BASE}/perfil-leitura`;
const RECOMENDAR_ENDPOINT = `${ASSISTENTE_API_BASE}/recomendar`;

function normalizePayload(payload) {
  if (!payload || typeof payload !== 'object') return null;

  if (typeof payload === 'string') {
    return { texto: payload };
  }

  const texto =
    payload.resposta ||
    payload.response ||
    payload.texto ||
    payload.mensagem ||
    payload.message ||
    payload.reply ||
    payload.output ||
    null;

  if (typeof texto === 'string') {
    return {
      texto,
      audioUrl: payload.audio_url || payload.audioUrl || null,
      raw: payload,
    };
  }

  if (payload.data && typeof payload.data === 'object') {
    return normalizePayload(payload.data);
  }

  return {
    texto: JSON.stringify(payload),
    raw: payload,
  };
}

function buildAudioPart(audioUri) {
  const name = audioUri.split('/').pop() || `gravacao-${Date.now()}.m4a`;
  const ext = (name.split('.').pop() || 'm4a').toLowerCase();

  const mimeTypes = {
    m4a: 'audio/mp4',
    mp4: 'audio/mp4',
    aac: 'audio/aac',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    webm: 'audio/webm',
    ogg: 'audio/ogg',
    caf: 'audio/x-caf',
    '3gp': 'audio/3gpp',
  };

  return {
    uri: audioUri,
    name,
    type: mimeTypes[ext] || 'audio/m4a',
  };
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function assertAssistantBaseUrl() {
  if (!ASSISTENTE_API_BASE) {
    throw new Error('EXPO_PUBLIC_ASSISTENTE_API_URL não configurada.');
  }
}

function normalizeAlunoId(alunoId) {
  const parsed = Number(alunoId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('aluno_id deve ser inteiro.');
  }
  return parsed;
}

async function postJson(endpoint, body) {
  assertAssistantBaseUrl();

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    const message =
      payload?.message || payload?.detail || payload?.error || 'Falha ao processar solicitação.';
    throw new Error(message);
  }

  return payload;
}

export async function enviarMensagemReforco({ alunoId, texto, audioUri }) {
  if (!alunoId) {
    throw new Error('aluno_id é obrigatório para consultar o assistente.');
  }

  const cleanText = typeof texto === 'string' ? texto.trim() : '';

  if (!cleanText && !audioUri) {
    throw new Error('Envie um texto, áudio, ou ambos.');
  }

  assertAssistantBaseUrl();

  let response;
  if (audioUri) {
    const body = new FormData();
    body.append('aluno_id', String(alunoId));
    if (cleanText) body.append('texto', cleanText);
    body.append('audio', buildAudioPart(audioUri));

    response = await fetch(CHAT_REFORCO_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      body,
    });
  } else {
    response = await fetch(CHAT_REFORCO_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ aluno_id: alunoId, texto: cleanText }),
    });
  }

  const payload = await parseResponse(response);

  if (!response.ok) {
    const message =
      payload?.message || payload?.detail || payload?.error || 'Falha ao enviar mensagem para o assistente.';
    throw new Error(message);
  }

  return normalizePayload(payload);
}

export async function recalcularPerfilLeitura(alunoId) {
  const alunoIdInt = normalizeAlunoId(alunoId);
  return postJson(PERFIL_LEITURA_ENDPOINT, { aluno_id: alunoIdInt });
}

export async function recomendarLeituras(alunoId) {
  const alunoIdInt = normalizeAlunoId(alunoId);
  return postJson(RECOMENDAR_ENDPOINT, { aluno_id: alunoIdInt });
}

export default { enviarMensagemReforco, recalcularPerfilLeitura, recomendarLeituras };
