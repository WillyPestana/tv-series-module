import type { CommentRepository } from '../ports.js';
import type { Comment } from '../models.js';

export class AddCommentUseCase {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(params: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> {
    if (params.text.trim().length === 0) {
      throw new Error('Comment text is required');
    }
    return this.commentRepository.addComment(params);
  }
}

export class ListCommentsUseCase {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(filter: { showId: number; episodeId?: number | null }): Promise<Comment[]> {
    return this.commentRepository.listComments(filter);
  }
}
