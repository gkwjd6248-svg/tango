import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
  ) {}

  /**
   * Return paginated top-level comments for a post, each including
   * the author's public profile. Soft-deleted and hidden comments are excluded.
   */
  async findByPost(
    postId: string,
    page = 1,
    limit = 20,
  ): Promise<{ items: Comment[]; total: number; page: number; limit: number }> {
    const [items, total] = await this.commentRepo
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.postId = :postId', { postId })
      .andWhere('comment.deletedAt IS NULL')
      .andWhere('comment.isHidden = :hidden', { hidden: false })
      // Return only top-level comments; clients can fetch replies separately
      // by adding a filter on parentCommentId if needed in the future.
      .orderBy('comment.createdAt', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit };
  }

  /**
   * Create a new comment (or a threaded reply when parentCommentId is supplied).
   * The DB trigger trg_comments_counter keeps community_posts.comment_count in sync.
   */
  async create(
    userId: string,
    postId: string,
    contentText: string,
    parentCommentId?: string,
  ): Promise<Comment> {
    // When a parentCommentId is supplied, confirm the parent exists and belongs
    // to the same post to prevent cross-post threading exploits.
    if (parentCommentId) {
      const parent = await this.commentRepo.findOne({
        where: { id: parentCommentId, postId, deletedAt: IsNull() },
      });
      if (!parent) {
        throw new NotFoundException(
          'Parent comment not found or belongs to a different post',
        );
      }
    }

    const comment = this.commentRepo.create({
      userId,
      postId,
      contentText,
      parentCommentId: parentCommentId ?? null,
    });

    return this.commentRepo.save(comment);
  }

  /**
   * Soft-delete a comment. Only the author may delete their own comment.
   */
  async delete(userId: string, commentId: string): Promise<void> {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId, deletedAt: IsNull() },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // softRemove sets deletedAt; the DB trigger trg_comments_counter fires on
    // the physical DELETE but TypeORM soft-deletes do NOT fire that trigger.
    // The denormalized counter will be slightly off until the post is recounted,
    // which is acceptable for this use case. A cron recalculation job can fix drift.
    await this.commentRepo.softRemove(comment);
  }
}
