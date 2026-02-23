import type { ShowsGateway } from '@tv-series-module/shared';
import type { Episode, ShowDetails, ShowSummary } from '@tv-series-module/shared';

const baseUrl = 'http://api.tvmaze.com';

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TVMaze request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
};

const parseYear = (date?: string | null): number | undefined => {
  if (!date) return undefined;
  const year = Number(date.slice(0, 4));
  return Number.isNaN(year) ? undefined : year;
};

const mapEpisode = (episode: any): Episode => ({
  id: episode.id,
  name: episode.name,
  season: episode.season,
  number: episode.number,
  summary: episode.summary ?? null
});

export class TvMazeGateway implements ShowsGateway {
  async browseShows(page: number): Promise<ShowSummary[]> {
    const safePage = Number.isFinite(page) && page >= 0 ? page : 0;
    const url = `${baseUrl}/shows?page=${safePage}`;
    const data = await fetchJson<any[]>(url);

    return data.map((show) => ({
      id: show.id,
      title: show.name,
      year: parseYear(show.premiered),
      posterUrl: show.image?.medium ?? null,
      genres: show.genres ?? []
    }));
  }

  async searchShows(query: string): Promise<ShowSummary[]> {
    const url = `${baseUrl}/search/shows?q=${encodeURIComponent(query)}`;
    const data = await fetchJson<any[]>(url);

    return data.map((item) => ({
      id: item.show.id,
      title: item.show.name,
      year: parseYear(item.show.premiered),
      posterUrl: item.show.image?.medium ?? null,
      genres: item.show.genres ?? []
    }));
  }

  async getShowSummary(showId: number): Promise<ShowSummary> {
    const show = await fetchJson<any>(`${baseUrl}/shows/${showId}`);
    return {
      id: show.id,
      title: show.name,
      year: parseYear(show.premiered),
      posterUrl: show.image?.medium ?? null,
      genres: show.genres ?? []
    };
  }

  async getShowDetails(showId: number): Promise<ShowDetails> {
    const showUrl = `${baseUrl}/shows/${showId}`;
    const episodesUrl = `${baseUrl}/shows/${showId}/episodes`;

    const [show, episodes] = await Promise.all([
      fetchJson<any>(showUrl),
      fetchJson<any[]>(episodesUrl)
    ]);

    return {
      id: show.id,
      title: show.name,
      summary: show.summary ?? null,
      genres: show.genres ?? [],
      posterUrl: show.image?.original ?? show.image?.medium ?? null,
      episodes: episodes.map(mapEpisode)
    };
  }
}
