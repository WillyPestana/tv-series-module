import type { WatchedRepository } from '@tv-series-module/shared';
import prisma from '../db/prisma.js';

export class PrismaWatchedRepository implements WatchedRepository {
  async isEpisodeWatched(showId: number, episodeId: number): Promise<boolean> {
    const record = await prisma.episodeWatched.findUnique({
      where: {
        showId_episodeId: {
          showId,
          episodeId
        }
      }
    });

    return record?.watched ?? false;
  }

  async getWatchedEpisodeIds(showId: number): Promise<number[]> {
    const records = await prisma.episodeWatched.findMany({
      where: { showId, watched: true },
      select: { episodeId: true }
    });

    return records.map((record: { episodeId: number }) => record.episodeId);
  }

  async setEpisodeWatched(showId: number, episodeId: number, watched: boolean): Promise<void> {
    await prisma.episodeWatched.upsert({
      where: {
        showId_episodeId: {
          showId,
          episodeId
        }
      },
      update: { watched },
      create: { showId, episodeId, watched }
    });
  }
}
