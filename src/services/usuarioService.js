import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/config';

/**
 * GET /api/usuarios/me — perfil + matrículas dos alunos vinculados.
 */
export function getProfile() {
  return apiClient.get(ENDPOINTS.ME);
}

/**
 * PUT /api/usuarios/me — atualização completa.
 * PATCH alias usa o mesmo payload UpdateUsuarioCommand: { nome?, telefone?, idAvatar? }
 */
export function updateProfile(payload) {
  return apiClient.put(ENDPOINTS.ME, payload);
}

export function patchProfile(payload) {
  return apiClient.patch(ENDPOINTS.ME, payload);
}

/**
 * POST /api/usuarios/me/senha
 * @param {{senhaAtual: string, novaSenha: string}} payload
 */
export function changePassword(payload) {
  return apiClient.post(ENDPOINTS.CHANGE_PASSWORD, payload);
}

/**
 * GET /api/usuarios/me/alunos — lista resumida (turma, livros lidos, livro atual).
 */
export function listAlunosVinculados() {
  return apiClient.get(ENDPOINTS.ALUNOS_VINCULADOS);
}

/**
 * POST /api/usuarios/me/alunos/{matricula} — vincula um aluno ao responsável.
 */
export function vincularAluno(matricula) {
  return apiClient.post(ENDPOINTS.VINCULAR_ALUNO(matricula));
}

/**
 * DELETE /api/usuarios/me/alunos/{alunoId} — desvincula aluno (id, não matrícula).
 */
export function desvincularAluno(alunoId) {
  return apiClient.delete(ENDPOINTS.DESVINCULAR_ALUNO(alunoId));
}

export default {
  getProfile,
  updateProfile,
  patchProfile,
  changePassword,
  listAlunosVinculados,
  vincularAluno,
  desvincularAluno,
};
