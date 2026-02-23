import type { ShowsGateway } from '../ports.js';
import type { ShowSummary } from '../models.js';

export class SearchShowsUseCase {
  constructor(private readonly showsGateway: ShowsGateway) {}

  async execute(query: string): Promise<ShowSummary[]> {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      return [];
    }
    return this.showsGateway.searchShows(trimmed);
  }
}
