import { describe, expect, it } from 'vitest';
import type { ShowsGateway } from '../src/ports.js';
import { SearchShowsUseCase } from '../src/usecases/searchShows.js';

const createGateway = (result: { id: number; title: string }[]): ShowsGateway => ({
  async browseShows() {
    return [];
  },
  async searchShows(query: string) {
    return result.map((show) => ({
      id: show.id,
      title: `${show.title} ${query}`,
      year: 2020,
      posterUrl: null
    }));
  },
  async getShowSummary() {
    throw new Error('not implemented');
  },
  async getShowDetails() {
    throw new Error('not implemented');
  }
});

describe('SearchShowsUseCase', () => {
  it('returns empty list when query is blank', async () => {
    const useCase = new SearchShowsUseCase(createGateway([]));
    await expect(useCase.execute('   ')).resolves.toEqual([]);
  });

  it('delegates to gateway for non-empty query', async () => {
    const useCase = new SearchShowsUseCase(createGateway([{ id: 1, title: 'Test' }]));
    const result = await useCase.execute('maze');
    expect(result).toEqual([
      { id: 1, title: 'Test maze', year: 2020, posterUrl: null }
    ]);
  });
});
