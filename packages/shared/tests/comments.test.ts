import { describe, expect, it } from 'vitest';
import type { CommentRepository } from '../src/ports.js';
import { AddCommentUseCase, ListCommentsUseCase } from '../src/usecases/comments.js';

describe('Comments use cases', () => {
  it('adds comment via repository', async () => {
    const repo: CommentRepository = {
      async addComment(comment) {
        return { ...comment, id: '1', createdAt: new Date('2025-01-02T00:00:00Z') };
      },
      async listComments() {
        return [];
      }
    };

    const useCase = new AddCommentUseCase(repo);
    const result = await useCase.execute({
      showId: 1,
      episodeId: null,
      author: 'Jo',
      text: 'Nice'
    });

    expect(result.id).toBe('1');
  });

  it('rejects empty comment text', async () => {
    const repo: CommentRepository = {
      async addComment() {
        throw new Error('not called');
      },
      async listComments() {
        return [];
      }
    };

    const useCase = new AddCommentUseCase(repo);
    await expect(
      useCase.execute({ showId: 1, episodeId: null, author: null, text: '   ' })
    ).rejects.toThrow('Comment text is required');
  });

  it('lists comments via repository', async () => {
    const repo: CommentRepository = {
      async addComment() {
        throw new Error('not used');
      },
      async listComments() {
        return [
          {
            id: 'c1',
            showId: 1,
            episodeId: null,
            author: 'Zoe',
            text: 'Yep',
            createdAt: new Date('2025-01-03T00:00:00Z')
          }
        ];
      }
    };

    const useCase = new ListCommentsUseCase(repo);
    const result = await useCase.execute({ showId: 1 });
    expect(result).toHaveLength(1);
  });
});
