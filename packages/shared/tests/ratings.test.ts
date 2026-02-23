import { describe, expect, it } from 'vitest';
import type { RatingRepository } from '../src/ports.js';
import { AddRatingUseCase, ListRatingsUseCase } from '../src/usecases/ratings.js';

describe('Ratings use cases', () => {
  it('adds rating via repository', async () => {
    const repo: RatingRepository = {
      async addRating(rating) {
        return { ...rating, id: 'r1', createdAt: new Date('2025-01-01T00:00:00Z') };
      },
      async listRatings() {
        return [];
      }
    };

    const useCase = new AddRatingUseCase(repo);
    const result = await useCase.execute({ showId: 1, score: 5, author: null });
    expect(result.id).toBe('r1');
  });

  it('rejects invalid score', async () => {
    const repo: RatingRepository = {
      async addRating() {
        throw new Error('not called');
      },
      async listRatings() {
        return [];
      }
    };

    const useCase = new AddRatingUseCase(repo);
    await expect(useCase.execute({ showId: 1, score: 6, author: null })).rejects.toThrow(
      'Score must be an integer between 1 and 5'
    );
  });

  it('lists ratings via repository', async () => {
    const repo: RatingRepository = {
      async addRating() {
        throw new Error('not used');
      },
      async listRatings() {
        return [
          {
            id: 'r1',
            showId: 1,
            score: 4,
            author: null,
            createdAt: new Date('2025-01-01T00:00:00Z')
          }
        ];
      }
    };

    const useCase = new ListRatingsUseCase(repo);
    const result = await useCase.execute({ showId: 1 });
    expect(result).toHaveLength(1);
  });
});
