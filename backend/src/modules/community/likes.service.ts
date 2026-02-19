import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './entities/like.entity';
import { CommunityPost } from './entities/post.entity';
import { Comment } from './entities/comment.entity';

export type LikeableType = 'post' | 'comment';

export interface ToggleResult {
  liked: boolean;   // true = like was created, false = like was removed
  likeCount: number; // current denormalized count on the target entity
}

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,

    @InjectRepository(CommunityPost)
    private readonly postRepo: Repository<CommunityPost>,

    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
  ) {}

  /**
   * Toggle a like on/off.
   *
   * The DB already has a trigger (trg_likes_counter) that keeps the denormalized
   * like_count columns in sync on hard INSERT / DELETE. We also update the
   * in-memory counter optimistically so the response reflects the new value
   * without an extra SELECT round-trip.
   *
   * Because TypeORM's softRemove does not fire DB-level DELETE triggers, we use
   * a hard delete (remove) for likes so the trigger fires correctly.
   */
  async toggle(
    userId: string,
    likeableType: LikeableType,
    likeableId: string,
  ): Promise<ToggleResult> {
    if (likeableType !== 'post' && likeableType !== 'comment') {
      throw new BadRequestException(
        "likeableType must be either 'post' or 'comment'",
      );
    }

    const existing = await this.likeRepo.findOne({
      where: { userId, likeableType, likeableId },
    });

    if (existing) {
      // Hard delete so the DB trigger fires and decrements the counter
      await this.likeRepo.remove(existing);
      const likeCount = await this.getCurrentLikeCount(likeableType, likeableId);
      return { liked: false, likeCount };
    }

    // Create the like row; DB trigger will increment the counter
    const like = this.likeRepo.create({ userId, likeableType, likeableId });
    await this.likeRepo.save(like);
    const likeCount = await this.getCurrentLikeCount(likeableType, likeableId);
    return { liked: true, likeCount };
  }

  /**
   * Check whether the current user has already liked the given entity.
   */
  async isLiked(
    userId: string,
    likeableType: LikeableType,
    likeableId: string,
  ): Promise<{ liked: boolean }> {
    const exists = await this.likeRepo.findOne({
      where: { userId, likeableType, likeableId },
    });
    return { liked: Boolean(exists) };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async getCurrentLikeCount(
    likeableType: LikeableType,
    likeableId: string,
  ): Promise<number> {
    if (likeableType === 'post') {
      const post = await this.postRepo.findOne({ where: { id: likeableId } });
      return post?.likeCount ?? 0;
    }
    const comment = await this.commentRepo.findOne({
      where: { id: likeableId },
    });
    return comment?.likeCount ?? 0;
  }
}
