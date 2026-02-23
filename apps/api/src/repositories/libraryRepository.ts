import type { LibraryRepository, SavedShow } from '@tv-series-module/shared';
import { Prisma } from '@prisma/client';
import prisma from '../db/prisma.js';

export class PrismaLibraryRepository implements LibraryRepository {
  async setShowSaved(showId: number, saved: boolean): Promise<void> {
    if (saved) {
      await prisma.$executeRaw(Prisma.sql`
        INSERT INTO "SavedShow" ("showId")
        VALUES (${showId})
        ON CONFLICT ("showId") DO NOTHING
      `);
      return;
    }

    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM "SavedShow"
      WHERE "showId" = ${showId}
    `);
  }

  async listSavedShows(): Promise<SavedShow[]> {
    const rows = await prisma.$queryRaw<{ showId: number; createdAt: Date }[]>(Prisma.sql`
      SELECT "showId", "createdAt"
      FROM "SavedShow"
      ORDER BY "createdAt" DESC
    `);

    return rows.map((row) => ({
      showId: row.showId,
      createdAt: row.createdAt
    }));
  }

  async isShowSaved(showId: number): Promise<boolean> {
    const rows = await prisma.$queryRaw<{ value: number }[]>(Prisma.sql`
      SELECT 1 AS value
      FROM "SavedShow"
      WHERE "showId" = ${showId}
      LIMIT 1
    `);
    return rows.length > 0;
  }
}
