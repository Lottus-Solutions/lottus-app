import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/config';

/**
 * GET /api/alunos/verificar-ra/{matricula} — endpoint público para checar matrícula.
 * Resposta: { matricula, nome, serie, vinculado }
 */
export function verificarMatricula(matricula) {
  return apiClient.get(ENDPOINTS.VERIFICAR_RA(matricula), { auth: false });
}

export default { verificarMatricula };
