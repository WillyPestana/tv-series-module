import type { CommentRepository, ShowsGateway, WatchedRepository } from '../ports.js';
import type { EpisodeWithState, SeasonGroup, ShowDetailsWithState } from '../models.js';

const groupEpisodesBySeason = (episodes: EpisodeWithState[]): SeasonGroup[] => {
  const grouped = new Map<number, EpisodeWithState[]>();
  for (const episode of episodes) {
    const list = grouped.get(episode.season) ?? [];
    list.push(episode);
    grouped.set(episode.season, list);
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a - b)
    .map(([season, seasonEpisodes]) => ({
      season,
      episodes: seasonEpisodes.sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
    }));
};

export class GetShowDetailsUseCase {
  constructor(
    private readonly showsGateway: ShowsGateway,
    private readonly watchedRepository: WatchedRepository,
    private readonly commentRepository: CommentRepository
  ) {}

  async execute(showId: number): Promise<ShowDetailsWithState> {
    const show = await this.showsGateway.getShowDetails(showId);
    const watchedIds = new Set(await this.watchedRepository.getWatchedEpisodeIds(showId));
    const comments = await this.commentRepository.listComments({ showId });

    const episodesWithState: EpisodeWithState[] = show.episodes.map((episode) => ({
      ...episode,
      watched: watchedIds.has(episode.id)
    }));

    return {
      id: show.id,
      title: show.title,
      summary: show.summary ?? null,
      genres: show.genres,
      posterUrl: show.posterUrl ?? null,
      seasons: groupEpisodesBySeason(episodesWithState),
      comments
    };
  }
}
