import prisma from '../db/prisma.js';
import type { ShowsGateway } from '@tv-series-module/shared';
import { Prisma } from '@prisma/client';

type RankedShow = {
  showId: number;
  title: string;
  posterUrl?: string | null;
  value: number;
};

export type DashboardPayload = {
  totals: {
    comments: number;
    watchedEpisodes: number;
    ratings: number;
  };
  topCommentedShows: RankedShow[];
  topWatchedShows: RankedShow[];
  topRatedShows: RankedShow[];
};

const mergeWithShowData = async (
  rows: { showId: number; value: number }[],
  showsGateway: ShowsGateway
): Promise<RankedShow[]> => {
  return Promise.all(
    rows.map(async (row) => {
      try {
        const show = await showsGateway.getShowSummary(row.showId);
        return {
          showId: row.showId,
          title: show.title,
          posterUrl: show.posterUrl ?? null,
          value: row.value
        };
      } catch {
        return {
          showId: row.showId,
          title: `Show #${row.showId}`,
          posterUrl: null,
          value: row.value
        };
      }
    })
  );
};

export class DashboardService {
  constructor(private readonly showsGateway: ShowsGateway) {}

  async getDashboard(): Promise<DashboardPayload> {
    const [totalComments, totalWatched, totalRatingsRow] = await Promise.all([
      prisma.comment.count(),
      prisma.episodeWatched.count({ where: { watched: true } }),
      prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`SELECT COUNT(*)::bigint AS count FROM "Rating"`)
    ]);
    const totalRatings = Number(totalRatingsRow[0]?.count ?? 0n);

    const [commentGroups, watchedGroups, ratingGroups] = await Promise.all([
      prisma.comment.groupBy({ by: ['showId'], _count: { showId: true }, orderBy: { _count: { showId: 'desc' } }, take: 5 }),
      prisma.episodeWatched.groupBy({ by: ['showId'], where: { watched: true }, _count: { showId: true }, orderBy: { _count: { showId: 'desc' } }, take: 5 }),
      prisma.$queryRaw<{ showId: number; avgScore: number }[]>(Prisma.sql`
        SELECT "showId", AVG(score)::float AS "avgScore"
        FROM "Rating"
        GROUP BY "showId"
        ORDER BY "avgScore" DESC
        LIMIT 5
      `)
    ]);

    const commentRows = commentGroups.map((entry) => ({ showId: entry.showId, value: entry._count.showId }));
    const watchedRows = watchedGroups.map((entry) => ({ showId: entry.showId, value: entry._count.showId }));
    const ratingRows = ratingGroups.map((entry) => ({ showId: entry.showId, value: Number(entry.avgScore ?? 0) }));

    const [topCommentedShows, topWatchedShows, topRatedShows] = await Promise.all([
      mergeWithShowData(commentRows, this.showsGateway),
      mergeWithShowData(watchedRows, this.showsGateway),
      mergeWithShowData(ratingRows, this.showsGateway)
    ]);

    return {
      totals: {
        comments: totalComments,
        watchedEpisodes: totalWatched,
        ratings: totalRatings
      },
      topCommentedShows,
      topWatchedShows,
      topRatedShows
    };
  }
}
