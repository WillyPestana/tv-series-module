import type { Comment, Rating, SavedShow, ShowDetails, ShowSummary } from './models.js';

export type ShowsGateway = {
  browseShows(page: number): Promise<ShowSummary[]>;
  searchShows(query: string): Promise<ShowSummary[]>;
  getShowSummary(showId: number): Promise<ShowSummary>;
  getShowDetails(showId: number): Promise<ShowDetails>;
};

export type WatchedRepository = {
  isEpisodeWatched(showId: number, episodeId: number): Promise<boolean>;
  getWatchedEpisodeIds(showId: number): Promise<number[]>;
  setEpisodeWatched(showId: number, episodeId: number, watched: boolean): Promise<void>;
};

export type CommentRepository = {
  addComment(comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment>;
  listComments(filter: { showId: number; episodeId?: number | null }): Promise<Comment[]>;
};

export type RatingRepository = {
  addRating(rating: Omit<Rating, 'id' | 'createdAt'>): Promise<Rating>;
  listRatings(filter: { showId: number }): Promise<Rating[]>;
};

export type LibraryRepository = {
  setShowSaved(showId: number, saved: boolean): Promise<void>;
  listSavedShows(): Promise<SavedShow[]>;
  isShowSaved(showId: number): Promise<boolean>;
};
