import { describe, expect, it, vi } from 'vitest';
import type { WatchedRepository } from '../src/ports.js';
import { ToggleEpisodeWatchedUseCase } from '../src/usecases/toggleEpisodeWatched.js';

describe('ToggleEpisodeWatchedUseCase', () => {
  it('delegates to repository', async () => {
    const setEpisodeWatched = vi.fn(async () => {});
    const repo: WatchedRepository = {
      async isEpisodeWatched() {
        return false;
      },
      async getWatchedEpisodeIds() {
        return [];
      },
      setEpisodeWatched
    };

    const useCase = new ToggleEpisodeWatchedUseCase(repo);
    await useCase.execute({ showId: 1, episodeId: 2, watched: true });

    expect(setEpisodeWatched).toHaveBeenCalledWith(1, 2, true);
  });
});
