import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/config';

/**
 * GET /api/alunos/{matricula}/emprestimos — histórico completo.
 */
export function listEmprestimos(matricula) {
  return apiClient.get(ENDPOINTS.EMPRESTIMOS(matricula));
}

/**
 * GET /api/alunos/{matricula}/emprestimos/atual — leitura em andamento (ou null).
 */
export function getEmprestimoAtual(matricula) {
  return apiClient.get(ENDPOINTS.EMPRESTIMO_ATUAL(matricula));
}

/**
 * POST /api/alunos/{matricula}/emprestimos
 * Body (CreateEmprestimoCommand): { livroId, dataEmprestimo?, dataDevolucaoPrevista? }
 */
export function registrarLeitura(matricula, payload) {
  return apiClient.post(ENDPOINTS.EMPRESTIMOS(matricula), payload);
}

/**
 * POST /api/alunos/{matricula}/emprestimos/{emprestimoId}/concluir
 */
export function concluirLeitura(matricula, emprestimoId) {
  return apiClient.post(ENDPOINTS.EMPRESTIMO_CONCLUIR(matricula, emprestimoId));
}

export default {
  listEmprestimos,
  getEmprestimoAtual,
  registrarLeitura,
  concluirLeitura,
};
