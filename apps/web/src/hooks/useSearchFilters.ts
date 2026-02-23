import { useMemo, useState } from 'react';
import type { ShowSummary } from '../api';

export const categories = [
  { label: 'All', value: 'all', seed: '' },
  { label: 'Drama', value: 'drama', seed: 'drama' },
  { label: 'Comedy', value: 'comedy', seed: 'comedy' },
  { label: 'Crime', value: 'crime', seed: 'crime' },
  { label: 'Thriller', value: 'thriller', seed: 'thriller' },
  { label: 'Sci-Fi', value: 'science-fiction', seed: 'science fiction' }
] as const;

export const yearFilters = ['all', 'new', 'classic'] as const;
export type YearFilter = (typeof yearFilters)[number];
export type CategoryFilter = (typeof categories)[number]['value'];

const matchesCategory = (show: ShowSummary, categoryFilter: CategoryFilter): boolean => {
  if (categoryFilter === 'all') return true;
  return (show.genres ?? []).some(
    (genre) => genre.toLowerCase() === categoryFilter || genre.toLowerCase().includes(categoryFilter)
  );
};

export const useSearchFilters = ({
  activeView,
  results,
  library,
  libraryIds
}: {
  activeView: 'discover' | 'library';
  results: ShowSummary[];
  library: ShowSummary[];
  libraryIds: Set<number>;
}) => {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [yearFilter, setYearFilter] = useState<YearFilter>('all');
  const [savedOnlyFilter, setSavedOnlyFilter] = useState(false);

  const trimmed = useMemo(() => query.trim(), [query]);

  const effectiveQuery = useMemo(() => {
    return trimmed;
  }, [trimmed]);

  const source = activeView === 'discover' ? results : library;

  const filteredItems = useMemo(() => {
    const byQuery =
      activeView === 'discover'
        ? source
        : source.filter((item) =>
            trimmed.length === 0 ? true : item.title.toLowerCase().includes(trimmed.toLowerCase())
          );

    const byCategory = byQuery.filter((item) => matchesCategory(item, categoryFilter));

    const byYear = byCategory.filter((item) => {
      if (yearFilter === 'all') return true;
      if (yearFilter === 'new') return typeof item.year === 'number' && item.year >= 2015;
      return typeof item.year === 'number' ? item.year < 2015 : true;
    });

    if (!savedOnlyFilter) return byYear;
    return byYear.filter((item) => libraryIds.has(item.id));
  }, [source, trimmed, yearFilter, savedOnlyFilter, libraryIds, activeView, categoryFilter]);

  return {
    query,
    setQuery,
    trimmed,
    effectiveQuery,
    categoryFilter,
    setCategoryFilter,
    yearFilter,
    setYearFilter,
    savedOnlyFilter,
    setSavedOnlyFilter,
    filteredItems
  };
};
