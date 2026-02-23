import Fastify, { type FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import fs from 'node:fs';
import path from 'node:path';
import {
  AddCommentUseCase,
  AddRatingUseCase,
  GetShowDetailsUseCase,
  ListSavedShowsUseCase,
  ListCommentsUseCase,
  ListRatingsUseCase,
  SearchShowsUseCase,
  SetShowSavedUseCase,
  ToggleEpisodeWatchedUseCase
} from '@tv-series-module/shared';
import type {
  CommentRepository,
  LibraryRepository,
  RatingRepository,
  ShowsGateway,
  WatchedRepository
} from '@tv-series-module/shared';
import type { DashboardPayload } from './services/dashboardService.js';

type DashboardServicePort = {
  getDashboard(): Promise<DashboardPayload>;
};

const parsePage = (value: string | number | undefined): number | null => {
  if (value === undefined) return 0;
  const page = Number(value);
  if (!Number.isInteger(page) || page < 0) return null;
  return page;
};

const parsePageSize = (value: string | number | undefined): number | null => {
  if (value === undefined) return 24;
  const pageSize = Number(value);
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 1000) return null;
  return pageSize;
};

const matchesCategory = (genres: string[] | undefined, category: string): boolean => {
  if (!category || category === 'all') return true;
  return (genres ?? []).some((genre) => genre.toLowerCase().includes(category.toLowerCase()));
};

const matchesYearFilter = (year: number | undefined, yearFilter: string): boolean => {
  if (!yearFilter || yearFilter === 'all') return true;
  if (yearFilter === 'new') return typeof year === 'number' && year >= 2015;
  if (yearFilter === 'classic') return typeof year === 'number' ? year < 2015 : true;
  return true;
};

export type AppDeps = {
  showsGateway: ShowsGateway;
  watchedRepository: WatchedRepository;
  commentRepository: CommentRepository;
  ratingRepository: RatingRepository;
  libraryRepository: LibraryRepository;
  dashboardService: DashboardServicePort;
  webDist?: string;
};

const registerRoutes = (server: FastifyInstance, deps: AppDeps) => {
  server.get('/health', async () => ({ status: 'ok' }));

  server.get('/api/search', async (request, reply) => {
    const query = request.query as { query?: string; page?: string | number; pageSize?: string | number };
    const page = parsePage(query.page);
    const pageSize = parsePageSize(query.pageSize);
    if (page === null || pageSize === null) {
      return reply.status(400).send({ error: 'Invalid pagination values' });
    }

    const rawQuery = (query.query ?? '').trim();
    if (rawQuery.length === 0) {
      const catalogPage = await deps.showsGateway.browseShows(page);
      const results = catalogPage.slice(0, pageSize);
      return {
        results,
        page,
        pageSize,
        totalResults: null,
        hasPrevPage: page > 0,
        hasNextPage: catalogPage.length > 0
      };
    }

    const useCase = new SearchShowsUseCase(deps.showsGateway);
    const all = await useCase.execute(rawQuery);
    const start = page * pageSize;
    const end = start + pageSize;
    return {
      results: all.slice(start, end),
      page,
      pageSize,
      totalResults: all.length,
      hasPrevPage: page > 0,
      hasNextPage: end < all.length
    };
  });

  server.get('/api/shows/:id', async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (Number.isNaN(id)) {
      return reply.status(400).send({ error: 'Invalid show id' });
    }

    const useCase = new GetShowDetailsUseCase(
      deps.showsGateway,
      deps.watchedRepository,
      deps.commentRepository
    );
    const [details, ratings] = await Promise.all([
      useCase.execute(id),
      new ListRatingsUseCase(deps.ratingRepository).execute({ showId: id })
    ]);
    const saved = await deps.libraryRepository.isShowSaved(id);

    const ratingsAverage =
      ratings.length === 0
        ? null
        : Number((ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length).toFixed(2));
    return {
      ...details,
      ratings,
      ratingSummary: {
        average: ratingsAverage,
        count: ratings.length
      },
      saved
    };
  });

  server.put('/api/episodes/:episodeId/watched', async (request, reply) => {
    const episodeId = Number((request.params as { episodeId: string }).episodeId);
    if (Number.isNaN(episodeId)) {
      return reply.status(400).send({ error: 'Invalid episode id' });
    }

    const body = request.body as { showId?: number; watched?: boolean } | undefined;
    if (!body || typeof body.showId !== 'number' || typeof body.watched !== 'boolean') {
      return reply.status(400).send({ error: 'Invalid payload' });
    }

    const useCase = new ToggleEpisodeWatchedUseCase(deps.watchedRepository);
    await useCase.execute({ showId: body.showId, episodeId, watched: body.watched });
    return { status: 'ok' };
  });

  server.get('/api/comments', async (request, reply) => {
    const query = request.query as { showId?: string; episodeId?: string };
    const showId = Number(query.showId);
    if (Number.isNaN(showId)) {
      return reply.status(400).send({ error: 'showId is required' });
    }

    const episodeId = query.episodeId !== undefined ? Number(query.episodeId) : undefined;
    if (query.episodeId !== undefined && Number.isNaN(episodeId)) {
      return reply.status(400).send({ error: 'episodeId must be a number' });
    }

    const useCase = new ListCommentsUseCase(deps.commentRepository);
    const comments = await useCase.execute({ showId, episodeId });
    return { comments };
  });

  server.post('/api/comments', async (request, reply) => {
    const body = request.body as {
      showId?: number;
      episodeId?: number | null;
      text?: string;
      author?: string | null;
    };

    if (!body || typeof body.showId !== 'number' || typeof body.text !== 'string') {
      return reply.status(400).send({ error: 'Invalid payload' });
    }

    const useCase = new AddCommentUseCase(deps.commentRepository);
    try {
      const comment = await useCase.execute({
        showId: body.showId,
        episodeId: body.episodeId ?? null,
        text: body.text,
        author: body.author ?? null
      });
      return reply.status(201).send({ comment });
    } catch (error) {
      return reply.status(400).send({ error: (error as Error).message });
    }
  });

  server.get('/api/ratings', async (request, reply) => {
    const query = request.query as { showId?: string };
    const showId = Number(query.showId);
    if (Number.isNaN(showId)) {
      return reply.status(400).send({ error: 'showId is required' });
    }

    const ratings = await new ListRatingsUseCase(deps.ratingRepository).execute({ showId });
    const average =
      ratings.length === 0
        ? null
        : Number((ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length).toFixed(2));
    return {
      ratings,
      summary: {
        average,
        count: ratings.length
      }
    };
  });

  server.post('/api/ratings', async (request, reply) => {
    const body = request.body as {
      showId?: number;
      score?: number;
      author?: string | null;
    };
    if (!body || typeof body.showId !== 'number' || typeof body.score !== 'number') {
      return reply.status(400).send({ error: 'Invalid payload' });
    }

    try {
      const rating = await new AddRatingUseCase(deps.ratingRepository).execute({
        showId: body.showId,
        score: body.score,
        author: body.author ?? null
      });
      return reply.status(201).send({ rating });
    } catch (error) {
      return reply.status(400).send({ error: (error as Error).message });
    }
  });

  server.get('/api/dashboard', async () => deps.dashboardService.getDashboard());

  server.get('/api/library', async (request, reply) => {
    const query = request.query as {
      query?: string;
      page?: string | number;
      pageSize?: string | number;
      category?: string;
      yearFilter?: string;
    };
    const page = parsePage(query.page);
    const pageSize = parsePageSize(query.pageSize);
    if (page === null || pageSize === null) {
      return reply.status(400).send({ error: 'Invalid pagination values' });
    }

    const normalizedQuery = (query.query ?? '').trim().toLowerCase();
    const category = (query.category ?? 'all').trim().toLowerCase();
    const yearFilter = (query.yearFilter ?? 'all').trim().toLowerCase();

    const savedShows = await new ListSavedShowsUseCase(deps.libraryRepository).execute();
    const hydratedShows = await Promise.all(
      savedShows.map(async ({ showId }) => {
        try {
          return await deps.showsGateway.getShowSummary(showId);
        } catch {
          return {
            id: showId,
            title: `Show #${showId}`,
            year: undefined,
            posterUrl: null,
            genres: []
          };
        }
      })
    );
    const filtered = hydratedShows.filter((show) => {
      const byQuery =
        normalizedQuery.length === 0 || show.title.toLowerCase().includes(normalizedQuery);
      const byCategory = matchesCategory(show.genres, category);
      const byYear = matchesYearFilter(show.year, yearFilter);
      return byQuery && byCategory && byYear;
    });

    const start = page * pageSize;
    const end = start + pageSize;
    const results = filtered.slice(start, end);
    return {
      shows: results,
      results,
      page,
      pageSize,
      totalResults: filtered.length,
      hasPrevPage: page > 0,
      hasNextPage: end < filtered.length
    };
  });

  server.put('/api/library/:showId', async (request, reply) => {
    const showId = Number((request.params as { showId: string }).showId);
    if (Number.isNaN(showId)) {
      return reply.status(400).send({ error: 'Invalid show id' });
    }

    const body = request.body as { saved?: boolean } | undefined;
    if (!body || typeof body.saved !== 'boolean') {
      return reply.status(400).send({ error: 'Invalid payload' });
    }

    await new SetShowSavedUseCase(deps.libraryRepository).execute({
      showId,
      saved: body.saved
    });

    return { status: 'ok' };
  });
};

export const buildServer = (deps: AppDeps): FastifyInstance => {
  const server = Fastify({ logger: true });

  server.setErrorHandler((error, _request, reply) => {
    server.log.error(error);
    reply.status(500).send({ error: 'Internal Server Error' });
  });

  registerRoutes(server, deps);

  const webDist = deps.webDist;
  if (webDist && fs.existsSync(webDist)) {
    server.register(fastifyStatic, { root: webDist });
    server.setNotFoundHandler((request, reply) => {
      if (request.method === 'GET' && !request.url.startsWith('/api')) {
        return reply.sendFile('index.html');
      }
      return reply.status(404).send({ error: 'Not Found' });
    });
  }

  return server;
};

export const resolveWebDist = (currentDir: string): string =>
  process.env.WEB_DIST ?? path.resolve(currentDir, '../../web/dist');
