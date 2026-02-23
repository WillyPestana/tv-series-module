import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getLibraryShows, setLibrarySaved, type ShowSummary } from '../api';

type LibraryContextValue = {
  items: ShowSummary[];
  ids: Set<number>;
  loading: boolean;
  error: string | null;
  toggle: (show: ShowSummary) => Promise<void>;
  refresh: () => Promise<void>;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ShowSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = await getLibraryShows({ page: 0, pageSize: 100 });
      setItems(payload.results ?? payload.shows ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const ids = useMemo(() => new Set(items.map((item) => item.id)), [items]);

  const toggle = async (show: ShowSummary) => {
    const shouldSave = !ids.has(show.id);
    setError(null);
    await setLibrarySaved(show.id, shouldSave);
    if (shouldSave) {
      setItems((current) => [show, ...current.filter((entry) => entry.id !== show.id)]);
      return;
    }
    setItems((current) => current.filter((entry) => entry.id !== show.id));
  };

  return (
    <LibraryContext.Provider value={{ items, ids, loading, error, toggle, refresh }}>
      {children}
    </LibraryContext.Provider>
  );
}

export const useLibrary = () => {
  const value = useContext(LibraryContext);
  if (!value) {
    throw new Error('useLibrary must be used inside LibraryProvider');
  }
  return value;
};
