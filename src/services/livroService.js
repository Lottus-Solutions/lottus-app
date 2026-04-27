import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/config';

/**
 * GET /api/livros?busca=...&page=0&size=20&sort=titulo,asc
 * Importante: o swagger marca `pageable` como required. Garantimos defaults para evitar 400.
 */
export function listLivros({ busca, page = 0, size = 20, sort } = {}) {
  const query = { page, size };
  if (busca) query.busca = busca;
  if (sort) query.sort = sort;
  return apiClient.get(ENDPOINTS.LIVROS, { query });
}

/**
 * GET /api/livros/{id}
 */
export function getLivro(id) {
  return apiClient.get(ENDPOINTS.LIVRO(id));
}

/**
 * Helper para busca por ISBN — o backend não expõe endpoint /isbn,
 * então buscamos via parâmetro genérico "busca" e filtramos exato.
 */
export async function buscarPorIsbn(isbn) {
  const result = await listLivros({ busca: isbn, size: 50 });
  const content = result?.content ?? [];
  return content.find((l) => (l.isbn || '').replace(/\D/g, '') === String(isbn).replace(/\D/g, '')) || null;
}

export default { listLivros, getLivro, buscarPorIsbn };
