import type { WatchedRepository } from '../ports.js';

export class ToggleEpisodeWatchedUseCase {
  constructor(private readonly watchedRepository: WatchedRepository) {}

  async execute(params: { showId: number; episodeId: number; watched: boolean }): Promise<void> {
    await this.watchedRepository.setEpisodeWatched(
      params.showId,
      params.episodeId,
      params.watched
    );
  }
}
