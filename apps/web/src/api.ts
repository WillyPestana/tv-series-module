export type ShowSummary = {
  id: number;
  title: string;
  year?: number;
  posterUrl?: string | null;
  genres?: string[];
};

export type Episode = {
  id: number;
  name: string;
  season: number;
  number?: number | null;
  summary?: string | null;
  watched: boolean;
};

export type SeasonGroup = {
  season: number;
  episodes: Episode[];
};

export type Comment = {
  id: string;
  showId: number;
  episodeId?: number | null;
  author?: string | null;
  text: string;
  createdAt: string;
};

export type Rating = {
  id: string;
  showId: number;
  score: number;
  author?: string | null;
  createdAt: string;
};

export type ShowDetailsResponse = {
  id: number;
  title: string;
  summary?: string | null;
  genres: string[];
  posterUrl?: string | null;
  seasons: SeasonGroup[];
  comments: Comment[];
  ratings: Rating[];
  ratingSummary: {
    average: number | null;
    count: number;
  };
  saved?: boolean;
};

export type SearchResponse = {
  results: ShowSummary[];
  page: number;
  pageSize: number;
  totalResults: number | null;
  hasPrevPage: boolean;
  hasNextPage: boolean;
};

export type DashboardEntry = {
  showId: number;
  title: string;
  posterUrl?: string | null;
  value: number;
};

export type DashboardResponse = {
  totals: {
    comments: number;
    watchedEpisodes: number;
    ratings: number;
  };
  topCommentedShows: DashboardEntry[];
  topWatchedShows: DashboardEntry[];
  topRatedShows: DashboardEntry[];
};

export type LibraryResponse = SearchResponse & {
  shows: ShowSummary[];
};

const apiFetch = async <T>(input: RequestInfo, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
};

export const searchShows = async (params: { query?: string; page?: number; pageSize?: number }) => {
  const query = new URLSearchParams();
  if (params.query !== undefined) query.set('query', params.query);
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.pageSize !== undefined) query.set('pageSize', String(params.pageSize));
  return apiFetch<SearchResponse>(`/api/search?${query.toString()}`);
};

export const getShowDetails = async (id: number) => apiFetch<ShowDetailsResponse>(`/api/shows/${id}`);

export const toggleEpisodeWatched = async (episodeId: number, payload: { showId: number; watched: boolean }) =>
  apiFetch<{ status: string }>(`/api/episodes/${episodeId}/watched`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

export const addComment = async (payload: { showId: number; episodeId?: number | null; text: string; author?: string | null }) =>
  apiFetch<{ comment: Comment }>(`/api/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

export const addRating = async (payload: { showId: number; score: number; author?: string | null }) =>
  apiFetch<{ rating: Rating }>(`/api/ratings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

export const getDashboard = async () => apiFetch<DashboardResponse>('/api/dashboard');

export const getLibraryShows = async (params?: {
  query?: string;
  page?: number;
  pageSize?: number;
  category?: string;
  yearFilter?: string;
}) => {
  const query = new URLSearchParams();
  if (params?.query !== undefined) query.set('query', params.query);
  if (params?.page !== undefined) query.set('page', String(params.page));
  if (params?.pageSize !== undefined) query.set('pageSize', String(params.pageSize));
  if (params?.category !== undefined) query.set('category', params.category);
  if (params?.yearFilter !== undefined) query.set('yearFilter', params.yearFilter);
  return apiFetch<LibraryResponse>(`/api/library?${query.toString()}`);
};

export const setLibrarySaved = async (showId: number, saved: boolean) =>
  apiFetch<{ status: string }>(`/api/library/${showId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ saved })
  });
