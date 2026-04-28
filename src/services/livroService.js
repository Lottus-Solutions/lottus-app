import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/config';

export function normalizarIsbn(isbn) {
  return String(isbn || '')
    .toUpperCase()
    .replace(/[^\dX]/g, '');
}

function validarIsbn10(isbn) {
  const value = normalizarIsbn(isbn);
  if (!/^\d{9}[\dX]$/.test(value)) return false;

  let soma = 0;
  for (let index = 0; index < 9; index += 1) {
    soma += Number(value[index]) * (10 - index);
  }
  const digito = value[9] === 'X' ? 10 : Number(value[9]);
  return (soma + digito) % 11 === 0;
}

function validarIsbn13(isbn) {
  const value = normalizarIsbn(isbn);
  if (!/^\d{13}$/.test(value)) return false;

  let soma = 0;
  for (let index = 0; index < 12; index += 1) {
    const multiplicador = index % 2 === 0 ? 1 : 3;
    soma += Number(value[index]) * multiplicador;
  }
  const digito = (10 - (soma % 10)) % 10;
  return digito === Number(value[12]);
}

export function extrairIsbnDoTexto(texto) {
  const textoNormalizado = String(texto || '').replace(/\s+/g, ' ');
  const candidatos = [];

  const regexComRotulo = /(?:ISBN(?:-1[03])?\s*[:\-]?\s*)([\dX][\dX\-\s]{8,20})/gi;
  let match = regexComRotulo.exec(textoNormalizado);
  while (match) {
    candidatos.push(match[1]);
    match = regexComRotulo.exec(textoNormalizado);
  }

  const regexPadrao = /(?:97[89][\-\s]?)?\d[\d\-\s]{7,}\d|\d{9}[\dX]/gi;
  match = regexPadrao.exec(textoNormalizado);
  while (match) {
    candidatos.push(match[0]);
    match = regexPadrao.exec(textoNormalizado);
  }

  const normalizados = candidatos
    .map((item) => normalizarIsbn(item))
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index);

  return (
    normalizados.find((item) => item.length === 13 && validarIsbn13(item)) ||
    normalizados.find((item) => item.length === 10 && validarIsbn10(item)) ||
    null
  );
}

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
  const isbnNormalizado = normalizarIsbn(isbn);
  if (!isbnNormalizado) return null;

  const result = await listLivros({ busca: isbnNormalizado, size: 50 });
  const content = result?.content ?? [];
  return (
    content.find((l) => normalizarIsbn(l.isbn) === isbnNormalizado) || null
  );
}

/**
 * Busca dados do livro na API pública do Google Books usando ISBN.
 * Retorna um objeto leve com os dados mais úteis para exibição.
 */
export async function buscarNoGooglePorIsbn(isbn) {
  const isbnNormalizado = normalizarIsbn(isbn);
  if (!isbnNormalizado) return null;

  const buscarNoOpenLibraryPorIsbn = async () => {
    const openLibraryController = new AbortController();
    const openLibraryTimeoutId = setTimeout(() => openLibraryController.abort(), 12000);
    try {
      const response = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(
          isbnNormalizado
        )}&format=json&jscmd=data`,
        {
          headers: {
            Accept: 'application/json',
          },
          signal: openLibraryController.signal,
        }
      );

      if (!response.ok) return null;

      const json = await response.json().catch(() => null);
      const item = json?.[`ISBN:${isbnNormalizado}`];
      if (!item) return null;

      return {
        googleId: null,
        titulo: item.title || 'Livro encontrado na Open Library',
        autor: Array.isArray(item.authors)
          ? item.authors.map((author) => author?.name).filter(Boolean).join(', ')
          : null,
        categoria: Array.isArray(item.subjects)
          ? item.subjects.map((subject) => subject?.name).filter(Boolean)[0] || null
          : null,
        isbn: isbnNormalizado,
        editora: Array.isArray(item.publishers)
          ? item.publishers.map((publisher) => publisher?.name).filter(Boolean)[0] || null
          : null,
        paginas: item.number_of_pages || null,
        descricao: typeof item.notes === 'string' ? item.notes : null,
        capa: item.cover?.large || item.cover?.medium || item.cover?.small || null,
        origem: 'open-library',
      };
    } catch (err) {
      if (err?.name === 'AbortError') return null;
      return null;
    } finally {
      clearTimeout(openLibraryTimeoutId);
    }
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;
    const params = new URLSearchParams({
      q: `isbn:${isbnNormalizado}`,
      maxResults: '1',
      projection: 'lite',
      printType: 'books',
    });
    if (apiKey) params.append('key', apiKey);

    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      // Quota/rate-limit ou indisponibilidade: tenta fallback aberto.
      return buscarNoOpenLibraryPorIsbn();
    }

    const json = await response.json().catch(() => null);
    const item = json?.items?.[0];
    const volumeInfo = item?.volumeInfo;
    if (!volumeInfo) return buscarNoOpenLibraryPorIsbn();

    const identifiers = Array.isArray(volumeInfo.industryIdentifiers)
      ? volumeInfo.industryIdentifiers
      : [];
    const isbnGoogle =
      identifiers.find((entry) => normalizarIsbn(entry?.identifier) === isbnNormalizado)
        ?.identifier ||
      identifiers.find((entry) => entry?.type === 'ISBN_13')?.identifier ||
      identifiers.find((entry) => entry?.type === 'ISBN_10')?.identifier ||
      isbnNormalizado;

    return {
      googleId: item.id,
      titulo: volumeInfo.title || 'Livro encontrado no Google Books',
      autor: Array.isArray(volumeInfo.authors) ? volumeInfo.authors.join(', ') : null,
      categoria: Array.isArray(volumeInfo.categories) ? volumeInfo.categories[0] : null,
      isbn: isbnGoogle,
      editora: volumeInfo.publisher || null,
      paginas: volumeInfo.pageCount || null,
      descricao: volumeInfo.description || null,
      capa: volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || null,
      origem: 'google-books',
    };
  } catch (err) {
    if (err?.name === 'AbortError') return buscarNoOpenLibraryPorIsbn();
    return buscarNoOpenLibraryPorIsbn();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Usa OCR em uma imagem local para tentar encontrar um ISBN no texto.
 * A implementação usa OCR.Space para evitar dependência nativa adicional no Expo.
 */
export async function extrairIsbnViaOcr(imageUri) {
  if (!imageUri) return null;

  const apiKey = process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY || 'helloworld';
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    name: 'isbn-capture.jpg',
    type: 'image/jpeg',
  });
  formData.append('language', 'por');
  formData.append('isOverlayRequired', 'false');
  formData.append('OCREngine', '2');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        apikey: apiKey,
      },
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const json = await response.json().catch(() => null);
    const parsedText = json?.ParsedResults?.[0]?.ParsedText || '';
    const isbn = extrairIsbnDoTexto(parsedText);

    if (!isbn) {
      return {
        texto: parsedText,
        isbn: null,
        bruto: json,
      };
    }

    return {
      texto: parsedText,
      isbn,
      bruto: json,
    };
  } catch (err) {
    if (err?.name === 'AbortError') return null;
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export default {
  listLivros,
  getLivro,
  buscarPorIsbn,
  buscarNoGooglePorIsbn,
  extrairIsbnViaOcr,
  extrairIsbnDoTexto,
  normalizarIsbn,
};
