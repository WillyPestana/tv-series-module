import type { Rating, RatingRepository } from '@tv-series-module/shared';
import prisma from '../db/prisma.js';
import { Prisma } from '@prisma/client';

export class PrismaRatingRepository implements RatingRepository {
  async addRating(rating: Omit<Rating, 'id' | 'createdAt'>): Promise<Rating> {
    const rows = await prisma.$queryRaw<
      { id: number; showId: number; score: number; author: string | null; createdAt: Date }[]
    >(Prisma.sql`
      INSERT INTO "Rating" ("showId", "score", "author")
      VALUES (${rating.showId}, ${rating.score}, ${rating.author ?? null})
      RETURNING id, "showId", score, author, "createdAt"
    `);
    const created = rows[0];

    return {
      id: String(created.id),
      showId: created.showId,
      score: created.score,
      author: created.author,
      createdAt: created.createdAt
    };
  }

  async listRatings(filter: { showId: number }): Promise<Rating[]> {
    const records = await prisma.$queryRaw<
      { id: number; showId: number; score: number; author: string | null; createdAt: Date }[]
    >(Prisma.sql`
      SELECT id, "showId", score, author, "createdAt"
      FROM "Rating"
      WHERE "showId" = ${filter.showId}
      ORDER BY "createdAt" DESC
    `);

    return records.map((record) => ({
      id: String(record.id),
      showId: record.showId,
      score: record.score,
      author: record.author,
      createdAt: record.createdAt
    }));
  }
}
