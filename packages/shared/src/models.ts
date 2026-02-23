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
};

export type ShowDetails = {
  id: number;
  title: string;
  summary?: string | null;
  genres: string[];
  posterUrl?: string | null;
  episodes: Episode[];
};

export type EpisodeWithState = Episode & {
  watched: boolean;
};

export type SeasonGroup = {
  season: number;
  episodes: EpisodeWithState[];
};

export type ShowDetailsWithState = {
  id: number;
  title: string;
  summary?: string | null;
  genres: string[];
  posterUrl?: string | null;
  seasons: SeasonGroup[];
  comments: Comment[];
};

export type Comment = {
  id: string;
  showId: number;
  episodeId?: number | null;
  author?: string | null;
  text: string;
  createdAt: Date;
};

export type Rating = {
  id: string;
  showId: number;
  score: number;
  author?: string | null;
  createdAt: Date;
};

export type SavedShow = {
  showId: number;
  createdAt: Date;
};
