import { describe, expect, it } from 'vitest';
import type { CommentRepository, ShowsGateway, WatchedRepository } from '../src/ports.js';
import { GetShowDetailsUseCase } from '../src/usecases/getShowDetails.js';

const createGateway = (): ShowsGateway => ({
  async browseShows() {
    return [];
  },
  async searchShows() {
    return [];
  },
  async getShowSummary(showId: number) {
    return { id: showId, title: 'Show', posterUrl: null, year: 2020, genres: ['Drama'] };
  },
  async getShowDetails(showId: number) {
    return {
      id: showId,
      title: 'Show',
      summary: 'Summary',
      genres: ['Drama'],
      posterUrl: null,
      episodes: [
        { id: 1, name: 'S1E1', season: 1, number: 1, summary: null },
        { id: 2, name: 'S1E2', season: 1, number: 2, summary: null },
        { id: 3, name: 'S2E1', season: 2, number: 1, summary: null }
      ]
    };
  }
});

const createWatchedRepo = (watchedIds: number[]): WatchedRepository => ({
  async isEpisodeWatched() {
    return false;
  },
  async getWatchedEpisodeIds() {
    return watchedIds;
  },
  async setEpisodeWatched() {}
});

const createCommentRepo = (): CommentRepository => ({
  async addComment() {
    throw new Error('not used');
  },
  async listComments() {
    return [
      {
        id: 'c1',
        showId: 99,
        episodeId: null,
        author: 'Ana',
        text: 'Great',
        createdAt: new Date('2025-01-01T00:00:00Z')
      }
    ];
  }
});

describe('GetShowDetailsUseCase', () => {
  it('groups episodes by season and adds watched state', async () => {
    const useCase = new GetShowDetailsUseCase(
      createGateway(),
      createWatchedRepo([2]),
      createCommentRepo()
    );

    const result = await useCase.execute(99);
    expect(result.seasons).toHaveLength(2);
    expect(result.seasons[0].season).toBe(1);
    expect(result.seasons[0].episodes[1].watched).toBe(true);
    expect(result.comments).toHaveLength(1);
  });
});
