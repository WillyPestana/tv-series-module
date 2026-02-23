import { describe, expect, it } from 'vitest';
import type { LibraryRepository } from '../src/ports.js';
import { ListSavedShowsUseCase, SetShowSavedUseCase } from '../src/usecases/library.js';

describe('Library use cases', () => {
  it('sets saved state', async () => {
    const state = new Set<number>();
    const repo: LibraryRepository = {
      async setShowSaved(showId, saved) {
        if (saved) state.add(showId);
        else state.delete(showId);
      },
      async listSavedShows() {
        return Array.from(state).map((showId) => ({ showId, createdAt: new Date('2025-01-01T00:00:00Z') }));
      },
      async isShowSaved(showId) {
        return state.has(showId);
      }
    };

    const useCase = new SetShowSavedUseCase(repo);
    await useCase.execute({ showId: 10, saved: true });
    expect(await repo.isShowSaved(10)).toBe(true);
  });

  it('lists saved shows', async () => {
    const repo: LibraryRepository = {
      async setShowSaved() {},
      async listSavedShows() {
        return [{ showId: 1, createdAt: new Date('2025-01-01T00:00:00Z') }];
      },
      async isShowSaved() {
        return false;
      }
    };

    const useCase = new ListSavedShowsUseCase(repo);
    const list = await useCase.execute();
    expect(list).toHaveLength(1);
  });
});
