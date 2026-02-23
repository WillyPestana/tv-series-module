import { useEffect, useState } from 'react';
import ShowCard from '../../components/ShowCard';
import {
  getLibraryShows,
  searchShows,
  type SearchResponse,
  type ShowSummary
} from '../../api';
import { useLibrary } from '../../hooks/useLibrary';
import { categories, type YearFilter, useSearchFilters } from '../../hooks/useSearchFilters';

export default function SearchPage() {
  const [results, setResults] = useState<ShowSummary[]>([]);
  const [libraryResults, setLibraryResults] = useState<ShowSummary[]>([]);
  const [pagination, setPagination] = useState<Pick<SearchResponse, 'page' | 'pageSize' | 'totalResults' | 'hasPrevPage' | 'hasNextPage'>>({
    page: 0,
    pageSize: 24,
    totalResults: null,
    hasPrevPage: false,
    hasNextPage: false
  });
  const [libraryPagination, setLibraryPagination] = useState<
    Pick<SearchResponse, 'page' | 'pageSize' | 'totalResults' | 'hasPrevPage' | 'hasNextPage'>
  >({
    page: 0,
    pageSize: 24,
    totalResults: 0,
    hasPrevPage: false,
    hasNextPage: false
  });
  const [loading, setLoading] = useState(false);
  const [libraryPageLoading, setLibraryPageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [libraryPageError, setLibraryPageError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'discover' | 'library'>('discover');
  const { items: library, ids: libraryIds, toggle, loading: libraryLoading, error: libraryError } = useLibrary();
  const {
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
  } = useSearchFilters({
    activeView,
    results,
    library,
    libraryIds
  });

  useEffect(() => {
    if (activeView !== 'discover') return;
    setPagination((current) => (current.page === 0 ? current : { ...current, page: 0 }));
  }, [trimmed, activeView]);

  useEffect(() => {
    if (activeView !== 'library') return;
    setLibraryPagination((current) => (current.page === 0 ? current : { ...current, page: 0 }));
  }, [trimmed, categoryFilter, yearFilter, activeView]);

  useEffect(() => {
    if (activeView !== 'discover') return;

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await searchShows({
          query: trimmed,
          page: pagination.page,
          pageSize: pagination.pageSize
        });
        setResults(data.results);
        setPagination({
          page: data.page,
          pageSize: data.pageSize,
          totalResults: data.totalResults,
          hasPrevPage: data.hasPrevPage,
          hasNextPage: data.hasNextPage
        });
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [trimmed, activeView, pagination.page, pagination.pageSize]);

  useEffect(() => {
    if (activeView !== 'library') return;

    const timeout = setTimeout(async () => {
      try {
        setLibraryPageLoading(true);
        setLibraryPageError(null);
        const data = await getLibraryShows({
          query: trimmed,
          page: libraryPagination.page,
          pageSize: libraryPagination.pageSize,
          category: categoryFilter,
          yearFilter
        });
        setLibraryResults(data.results);
        setLibraryPagination({
          page: data.page,
          pageSize: data.pageSize,
          totalResults: data.totalResults,
          hasPrevPage: data.hasPrevPage,
          hasNextPage: data.hasNextPage
        });
      } catch (err) {
        setLibraryPageError((err as Error).message);
      } finally {
        setLibraryPageLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [activeView, trimmed, categoryFilter, yearFilter, libraryPagination.page, libraryPagination.pageSize]);

  const itemsToRender = activeView === 'library' ? libraryResults : filteredItems;
  const activePagination = activeView === 'library' ? libraryPagination : pagination;
  const activeLoading = activeView === 'library' ? libraryPageLoading : loading;

  return (
    <section className="search-page" aria-busy={loading}>
      <div className="search-page__hero">
        <p className="search-page__kicker">TV SERIES MODULE</p>
        <h2>Find your next binge in seconds</h2>
        <p className="search-page__description">
          Search shows from TVMaze, open details, track watched episodes, and leave comments.
        </p>
      </div>
      <div className="search-page__controls">
        <div className="search-page__tabs">
          <button
            type="button"
            className={activeView === 'discover' ? 'is-active' : ''}
            onClick={() => {
              setActiveView('discover');
              setCategoryFilter('all');
            }}
          >
            Discover
          </button>
          <button
            type="button"
            className={activeView === 'library' ? 'is-active' : ''}
            onClick={() => setActiveView('library')}
          >
            My Library ({library.length})
          </button>
        </div>
        <div className="search-page__categories">
          {categories.map((entry) => (
            <button
              key={entry.value}
              type="button"
              className={categoryFilter === entry.value ? 'is-active' : ''}
              onClick={() => {
                setCategoryFilter(entry.value);
              }}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <div className="search-page__filters">
          <label>
            Year
            <select
              value={yearFilter}
              onChange={(event) => setYearFilter(event.target.value as YearFilter)}
            >
              <option value="all">All</option>
              <option value="new">New (2015+)</option>
              <option value="classic">Classic (&lt;2015)</option>
            </select>
          </label>
          {activeView === 'discover' ? (
            <label className="search-page__saved-filter">
              <input
                type="checkbox"
                checked={savedOnlyFilter}
                onChange={(event) => setSavedOnlyFilter(event.target.checked)}
              />
              Saved only
            </label>
          ) : null}
        </div>
      </div>
      <input
        className="search-input"
        placeholder={activeView === 'discover' ? 'Search for a show' : 'Filter your library'}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {activeLoading && (
        <p className="loading" role="status" aria-live="polite">
          {activeView === 'discover' ? 'Loading shows...' : 'Loading library...'}
        </p>
      )}
      {activeView === 'discover' && error ? (
        <p className="error" role="alert">
          Could not load search results: {error}
        </p>
      ) : null}
      {activeView === 'library' && libraryPageError ? (
        <p className="error" role="alert">
          Could not load library page: {libraryPageError}
        </p>
      ) : null}
      {libraryError ? (
        <p className="error" role="alert">
          Could not load library: {libraryError}
        </p>
      ) : null}
      {!activeLoading && !error && trimmed.length > 0 && itemsToRender.length === 0 ? (
        <p className="empty-state" role="status" aria-live="polite">
          No shows found with current filters.
        </p>
      ) : null}
      {!activeLoading && !error && activeView === 'library' && activePagination.totalResults === 0 ? (
        <p className="empty-state" role="status" aria-live="polite">
          Your library is empty. Save shows from Discover to build your shelf.
        </p>
      ) : null}
      <div className="show-grid">
        {itemsToRender.map((show) => (
          <ShowCard
            key={show.id}
            show={show}
            inLibrary={libraryIds.has(show.id)}
            onToggleLibrary={toggle}
          />
        ))}
      </div>
      {activeView === 'discover' || activeView === 'library' ? (
        <div className="search-page__more">
          <button
            type="button"
            onClick={() => {
              if (activeView === 'discover') {
                setPagination((current) => ({ ...current, page: Math.max(current.page - 1, 0) }));
                return;
              }
              setLibraryPagination((current) => ({ ...current, page: Math.max(current.page - 1, 0) }));
            }}
            disabled={!activePagination.hasPrevPage || activeLoading}
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => {
              if (activeView === 'discover') {
                setPagination((current) => ({ ...current, page: current.page + 1 }));
                return;
              }
              setLibraryPagination((current) => ({ ...current, page: current.page + 1 }));
            }}
            disabled={!activePagination.hasNextPage || activeLoading}
          >
            Next
          </button>
          <p>
            Page {activePagination.page + 1}
            {activePagination.totalResults !== null
              ? ` of ${Math.max(1, Math.ceil(activePagination.totalResults / activePagination.pageSize))}`
              : ''}
          </p>
        </div>
      ) : null}
    </section>
  );
}
