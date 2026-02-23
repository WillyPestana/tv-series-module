import type { Comment, CommentRepository } from '@tv-series-module/shared';
import prisma from '../db/prisma.js';

export class PrismaCommentRepository implements CommentRepository {
  async addComment(comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> {
    const created = await prisma.comment.create({
      data: {
        showId: comment.showId,
        episodeId: comment.episodeId ?? null,
        author: comment.author ?? null,
        text: comment.text
      }
    });

    return {
      id: created.id,
      showId: created.showId,
      episodeId: created.episodeId,
      author: created.author,
      text: created.text,
      createdAt: created.createdAt
    };
  }

  async listComments(filter: { showId: number; episodeId?: number | null }): Promise<Comment[]> {
    const where: { showId: number; episodeId?: number | null } = {
      showId: filter.showId
    };
    if (filter.episodeId !== undefined) {
      where.episodeId = filter.episodeId;
    }

    const records = await prisma.comment.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return records.map((record: { id: string; showId: number; episodeId: number | null; author: string | null; text: string; createdAt: Date }) => ({
      id: record.id,
      showId: record.showId,
      episodeId: record.episodeId,
      author: record.author,
      text: record.text,
      createdAt: record.createdAt
    }));
  }
}
