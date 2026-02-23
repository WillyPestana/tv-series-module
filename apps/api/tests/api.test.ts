import { describe, expect, it } from 'vitest';
import { buildServer } from '../src/app.js';
import type {
  CommentRepository,
  LibraryRepository,
  RatingRepository,
  ShowsGateway,
  WatchedRepository
} from '@tv-series-module/shared';

const createGateway = (): ShowsGateway => ({
  async browseShows(page: number) {
    return [
      { id: page * 10 + 1, title: `Browse ${page}`, year: 2019, posterUrl: null, genres: [] }
    ];
  },
  async searchShows(query: string) {
    return [
      { id: 1, title: `Show ${query}`, year: 2020, posterUrl: null, genres: ['Drama'] }
    ];
  },
  async getShowSummary(showId: number) {
    return {
      id: showId,
      title: `Show #${showId}`,
      year: 2020,
      posterUrl: null,
      genres: []
    };
  },
  async getShowDetails(showId: number) {
    return {
      id: showId,
      title: 'Show',
      summary: 'Summary',
      genres: ['Drama'],
      posterUrl: null,
      episodes: [
        { id: 11, name: 'Pilot', season: 1, number: 1, summary: null },
        { id: 12, name: 'Finale', season: 1, number: 2, summary: null }
      ]
    };
  }
});

const createWatchedRepo = (): WatchedRepository => {
  const watched = new Map<string, boolean>();
  return {
    async isEpisodeWatched(showId: number, episodeId: number) {
      return watched.get(`${showId}:${episodeId}`) ?? false;
    },
    async getWatchedEpisodeIds(showId: number) {
      return Array.from(watched.entries())
        .filter(([key, value]) => key.startsWith(`${showId}:`) && value)
        .map(([key]) => Number(key.split(':')[1]));
    },
    async setEpisodeWatched(showId: number, episodeId: number, value: boolean) {
      watched.set(`${showId}:${episodeId}`, value);
    }
  };
};

const createCommentRepo = (): CommentRepository => {
  const comments: any[] = [];
  return {
    async addComment(comment) {
      const created = {
        id: `c${comments.length + 1}`,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        ...comment
      };
      comments.unshift(created);
      return created;
    },
    async listComments(filter) {
      return comments.filter((comment) => {
        if (comment.showId !== filter.showId) return false;
        if (filter.episodeId === undefined) return true;
        return comment.episodeId === filter.episodeId;
      });
    }
  };
};

const createRatingRepo = (): RatingRepository => {
  const ratings: any[] = [];
  return {
    async addRating(rating) {
      const created = {
        id: `r${ratings.length + 1}`,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        ...rating
      };
      ratings.unshift(created);
      return created;
    },
    async listRatings(filter) {
      return ratings.filter((rating) => rating.showId === filter.showId);
    }
  };
};

const createLibraryRepo = (): LibraryRepository => {
  const ids = new Set<number>();
  return {
    async setShowSaved(showId, saved) {
      if (saved) ids.add(showId);
      else ids.delete(showId);
    },
    async listSavedShows() {
      return Array.from(ids).map((showId) => ({
        showId,
        createdAt: new Date('2025-01-01T00:00:00Z')
      }));
    },
    async isShowSaved(showId) {
      return ids.has(showId);
    }
  };
};

const createDashboardService = () => ({
  async getDashboard() {
    return {
      totals: {
        comments: 2,
        watchedEpisodes: 5,
        ratings: 1
      },
      topCommentedShows: [{ showId: 1, title: 'Show #1', value: 2, posterUrl: null }],
      topWatchedShows: [{ showId: 1, title: 'Show #1', value: 5, posterUrl: null }],
      topRatedShows: [{ showId: 1, title: 'Show #1', value: 4.5, posterUrl: null }]
    };
  }
});

describe('API routes', () => {
  it('searches shows', async () => {
    const server = buildServer({
      showsGateway: createGateway(),
      watchedRepository: createWatchedRepo(),
      commentRepository: createCommentRepo(),
      ratingRepository: createRatingRepo(),
      libraryRepository: createLibraryRepo(),
      dashboardService: createDashboardService()
    });

    const response = await server.inject({
      method: 'GET',
      url: '/api/search?query=test&page=0&pageSize=20'
    });
    expect(response.statusCode).toBe(200);
    const payload = response.json();
    expect(payload.results[0].title).toBe('Show test');
    expect(payload.hasNextPage).toBe(false);
  });

  it('returns details with watched state and comments', async () => {
    const watchedRepo = createWatchedRepo();
    await watchedRepo.setEpisodeWatched(99, 11, true);
    const commentRepo = createCommentRepo();
    const libraryRepo = createLibraryRepo();
    await libraryRepo.setShowSaved(99, true);
    await commentRepo.addComment({ showId: 99, episodeId: null, author: 'Ana', text: 'Hi' });

    const server = buildServer({
      showsGateway: createGateway(),
      watchedRepository: watchedRepo,
      commentRepository: commentRepo,
      ratingRepository: createRatingRepo(),
      libraryRepository: libraryRepo,
      dashboardService: createDashboardService()
    });

    const response = await server.inject({ method: 'GET', url: '/api/shows/99' });
    expect(response.statusCode).toBe(200);
    const payload = response.json();
    expect(payload.seasons[0].episodes[0].watched).toBe(true);
    expect(payload.comments).toHaveLength(1);
    expect(payload.saved).toBe(true);
  });

  it('toggles watched state', async () => {
    const watchedRepo = createWatchedRepo();
    const server = buildServer({
      showsGateway: createGateway(),
      watchedRepository: watchedRepo,
      commentRepository: createCommentRepo(),
      ratingRepository: createRatingRepo(),
      libraryRepository: createLibraryRepo(),
      dashboardService: createDashboardService()
    });

    const response = await server.inject({
      method: 'PUT',
      url: '/api/episodes/11/watched',
      payload: { showId: 99, watched: true }
    });

    expect(response.statusCode).toBe(200);
    expect(await watchedRepo.isEpisodeWatched(99, 11)).toBe(true);
  });

  it('adds and lists comments', async () => {
    const commentRepo = createCommentRepo();
    const server = buildServer({
      showsGateway: createGateway(),
      watchedRepository: createWatchedRepo(),
      commentRepository: commentRepo,
      ratingRepository: createRatingRepo(),
      libraryRepository: createLibraryRepo(),
      dashboardService: createDashboardService()
    });

    const createResponse = await server.inject({
      method: 'POST',
      url: '/api/comments',
      payload: { showId: 1, text: 'Nice', author: 'Zoe' }
    });

    expect(createResponse.statusCode).toBe(201);

    const listResponse = await server.inject({
      method: 'GET',
      url: '/api/comments?showId=1'
    });

    expect(listResponse.statusCode).toBe(200);
    const payload = listResponse.json();
    expect(payload.comments).toHaveLength(1);
  });

  it('returns 400 for invalid show id', async () => {
    const server = buildServer({
      showsGateway: createGateway(),
      watchedRepository: createWatchedRepo(),
      commentRepository: createCommentRepo(),
      ratingRepository: createRatingRepo(),
      libraryRepository: createLibraryRepo(),
      dashboardService: createDashboardService()
    });

    const response = await server.inject({ method: 'GET', url: '/api/shows/abc' });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: 'Invalid show id' });
  });

  it('returns 400 for invalid watched payload', async () => {
    const server = buildServer({
      showsGateway: createGateway(),
      watchedRepository: createWatchedRepo(),
      commentRepository: createCommentRepo(),
      ratingRepository: createRatingRepo(),
      libraryRepository: createLibraryRepo(),
      dashboardService: createDashboardService()
    });

    const response = await server.inject({
      method: 'PUT',
      url: '/api/episodes/11/watched',
      payload: { showId: 'nope', watched: 'yes' }
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: 'Invalid payload' });
  });

  it('returns 400 when showId is missing for comments', async () => {
    const server = buildServer({
      showsGateway: createGateway(),
      watchedRepository: createWatchedRepo(),
      commentRepository: createCommentRepo(),
      ratingRepository: createRatingRepo(),
      libraryRepository: createLibraryRepo(),
      dashboardService: createDashboardService()
    });

    const response = await server.inject({
      method: 'GET',
      url: '/api/comments'
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: 'showId is required' });
  });

  it('adds and lists ratings', async () => {
    const ratingRepo = createRatingRepo();
    const server = buildServer({
      showsGateway: createGateway(),
      watchedRepository: createWatchedRepo(),
      commentRepository: createCommentRepo(),
      ratingRepository: ratingRepo,
      libraryRepository: createLibraryRepo(),
      dashboardService: createDashboardService()
    });

    const createResponse = await server.inject({
      method: 'POST',
      url: '/api/ratings',
      payload: { showId: 1, score: 5, author: 'Ana' }
    });
    expect(createResponse.statusCode).toBe(201);

    const listResponse = await server.inject({
      method: 'GET',
      url: '/api/ratings?showId=1'
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json().ratings).toHaveLength(1);
  });

  it('returns dashboard payload', async () => {
    const server = buildServer({
      showsGateway: createGateway(),
      watchedRepository: createWatchedRepo(),
      commentRepository: createCommentRepo(),
      ratingRepository: createRatingRepo(),
      libraryRepository: createLibraryRepo(),
      dashboardService: createDashboardService()
    });

    const response = await server.inject({
      method: 'GET',
      url: '/api/dashboard'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().totals.watchedEpisodes).toBe(5);
  });

  it('saves and lists library shows', async () => {
    const libraryRepo = createLibraryRepo();
    const server = buildServer({
      showsGateway: createGateway(),
      watchedRepository: createWatchedRepo(),
      commentRepository: createCommentRepo(),
      ratingRepository: createRatingRepo(),
      libraryRepository: libraryRepo,
      dashboardService: createDashboardService()
    });

    const saveResponse = await server.inject({
      method: 'PUT',
      url: '/api/library/7',
      payload: { saved: true }
    });
    expect(saveResponse.statusCode).toBe(200);

    const listResponse = await server.inject({
      method: 'GET',
      url: '/api/library?page=0&pageSize=10&query=show'
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json().shows).toHaveLength(1);
    expect(listResponse.json().page).toBe(0);
    expect(listResponse.json().totalResults).toBe(1);
  });
});
