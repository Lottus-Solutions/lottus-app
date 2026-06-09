import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/config';

/**
 * GET /api/alunos/{matricula}/dashboard/resumo
 * Retorna KPIs do mês atual:
 *   { livrosLidosNoMes, diasComLivroAtual, tituloLivroAtual,
 *     percentualMetasMensais, totalMetasMensais, metasMensaisConcluidas }
 */
export function getResumo(matricula) {
  return apiClient.get(ENDPOINTS.DASHBOARD_RESUMO(matricula));
}

/**
 * GET /api/alunos/{matricula}/dashboard/generos
 * Retorna distribuição de leituras por categoria:
 *   Array<{ categoria, total, percentual }>
 */
export function getGeneros(matricula) {
  return apiClient.get(ENDPOINTS.DASHBOARD_GENEROS(matricula));
}

/**
 * GET /api/alunos/{matricula}/dashboard/evolucao-mensal?meses={meses}
 * Retorna evolução de leituras concluídas por mês (zeros incluídos):
 *   Array<{ ano, mes, total }>
 * @param {string} matricula
 * @param {number} meses - quantidade de meses retroativos (1–24, default 6)
 */
export function getEvolucaoMensal(matricula, meses = 6) {
  return apiClient.get(`${ENDPOINTS.DASHBOARD_EVOLUCAO(matricula)}?meses=${meses}`);
}

/**
 * GET /api/alunos/{matricula}/dashboard/atividades?limit={limit}
 * Retorna feed de atividades recentes em ordem decrescente:
 *   Array<{ id, tipo, referenciaTipo, referenciaId, tituloResumo, ocorridoEm }>
 * @param {string} matricula
 * @param {number} limit - quantidade de registros (1–50, default 10)
 */
export function getAtividades(matricula, limit = 10) {
  return apiClient.get(`${ENDPOINTS.DASHBOARD_ATIVIDADES(matricula)}?limit=${limit}`);
}

export default { getResumo, getGeneros, getEvolucaoMensal, getAtividades };
