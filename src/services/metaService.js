import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/config';

/**
 * GET /api/alunos/{matricula}/metas?status=ATIVA|CONCLUIDA|ARQUIVADA
 */
export function listMetas(matricula, status) {
  return apiClient.get(ENDPOINTS.METAS(matricula), {
    query: status ? { status } : undefined,
  });
}

/**
 * GET /api/alunos/{matricula}/metas/{metaId}
 */
export function getMeta(matricula, metaId) {
  return apiClient.get(ENDPOINTS.META(matricula, metaId));
}

/**
 * POST /api/alunos/{matricula}/metas
 * Body (CreateMetaCommand):
 *  { tipo, titulo?, descricao?, tipoValidacao, valorAlvo?, filtroValor?, dataInicio, dataFim }
 *  - tipo:        LIVROS_LIDOS | LIVROS_COM_PALAVRA_CHAVE | CUSTOM
 *  - tipoValidacao: BOOLEAN | PERCENTUAL
 */
export function createMeta(matricula, payload) {
  return apiClient.post(ENDPOINTS.METAS(matricula), payload);
}

/**
 * PUT /api/alunos/{matricula}/metas/{metaId}
 * Body (UpdateMetaCommand): { titulo?, descricao?, valorAlvo?, filtroValor?, dataInicio?, dataFim? }
 */
export function updateMeta(matricula, metaId, payload) {
  return apiClient.put(ENDPOINTS.META(matricula, metaId), payload);
}

/**
 * DELETE /api/alunos/{matricula}/metas/{metaId}
 */
export function deleteMeta(matricula, metaId) {
  return apiClient.delete(ENDPOINTS.META(matricula, metaId));
}

/**
 * PATCH /api/alunos/{matricula}/metas/{metaId}/progresso
 * Body: { valorAtual: number }  (BOOLEAN: 0|1)
 */
export function updateMetaProgresso(matricula, metaId, valorAtual) {
  return apiClient.patch(ENDPOINTS.META_PROGRESSO(matricula, metaId), {
    valorAtual,
  });
}

export default {
  listMetas,
  getMeta,
  createMeta,
  updateMeta,
  deleteMeta,
  updateMetaProgresso,
};
