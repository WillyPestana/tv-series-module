import type { Rating } from '../models.js';
import type { RatingRepository } from '../ports.js';

export class AddRatingUseCase {
  constructor(private readonly ratingRepository: RatingRepository) {}

  async execute(params: Omit<Rating, 'id' | 'createdAt'>): Promise<Rating> {
    if (!Number.isInteger(params.score) || params.score < 1 || params.score > 5) {
      throw new Error('Score must be an integer between 1 and 5');
    }
    return this.ratingRepository.addRating(params);
  }
}

export class ListRatingsUseCase {
  constructor(private readonly ratingRepository: RatingRepository) {}

  async execute(filter: { showId: number }): Promise<Rating[]> {
    return this.ratingRepository.listRatings(filter);
  }
}
