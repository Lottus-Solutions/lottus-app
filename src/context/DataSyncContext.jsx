import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

/**
 * DataSyncContext: pequeno barramento reativo para invalidação cruzada de dados.
 *
 * Cada entidade (alunos, emprestimos, metas, livros) tem um número de versão.
 * Telas leem `useDataVersion('emprestimos')` e usam o valor como dependência
 * de seu useEffect de fetch — quando outra tela chamar `invalidate('emprestimos')`,
 * todas as telas listening reexecutam o fetch automaticamente.
 *
 * Uso típico:
 *   // Em uma tela de listagem:
 *   const version = useDataVersion('emprestimos');
 *   useEffect(() => { fetch(); }, [matricula, version]);
 *
 *   // Em uma tela de mutação:
 *   const { invalidate } = useDataSync();
 *   await api.concluir(...);
 *   invalidate(['emprestimos', 'metas', 'alunos']);
 */

const ENTITIES = ['alunos', 'emprestimos', 'metas', 'livros', 'usuario'];

const DataSyncContext = createContext(null);

export function DataSyncProvider({ children }) {
  const [versions, setVersions] = useState(() =>
    Object.fromEntries(ENTITIES.map((e) => [e, 0]))
  );

  const invalidate = useCallback((entityOrEntities) => {
    const list = Array.isArray(entityOrEntities)
      ? entityOrEntities
      : [entityOrEntities];
    setVersions((prev) => {
      const next = { ...prev };
      list.forEach((e) => {
        if (e) next[e] = (next[e] || 0) + 1;
      });
      return next;
    });
  }, []);

  const invalidateAll = useCallback(() => {
    setVersions((prev) => {
      const next = {};
      Object.keys(prev).forEach((k) => {
        next[k] = (prev[k] || 0) + 1;
      });
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ versions, invalidate, invalidateAll }),
    [versions, invalidate, invalidateAll]
  );

  return (
    <DataSyncContext.Provider value={value}>{children}</DataSyncContext.Provider>
  );
}

export function useDataSync() {
  const ctx = useContext(DataSyncContext);
  if (!ctx) {
    throw new Error('useDataSync deve ser usado dentro de <DataSyncProvider>');
  }
  return ctx;
}

export function useDataVersion(entity) {
  const { versions } = useDataSync();
  return versions[entity] ?? 0;
}

export default DataSyncContext;
