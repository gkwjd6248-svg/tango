import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventVote } from './entities/event-vote.entity';
import { TangoEvent } from './entities/event.entity';

export interface VoteResult {
  likes: number;
  dislikes: number;
  userVote: 'like' | 'dislike' | null;
}

@Injectable()
export class VotesService {
  constructor(
    @InjectRepository(EventVote)
    private readonly voteRepo: Repository<EventVote>,

    @InjectRepository(TangoEvent)
    private readonly eventRepo: Repository<TangoEvent>,
  ) {}

  /**
   * Toggle a vote on an event.
   * - If the user has the same vote, remove it.
   * - If the user has a different vote, change it.
   * - If the user has no vote, create one.
   */
  async toggleVote(
    eventId: string,
    userId: string,
    voteType: 'like' | 'dislike',
  ): Promise<VoteResult> {
    // Verify the event exists
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const existing = await this.voteRepo.findOne({
      where: { eventId, userId },
    });

    if (existing) {
      if (existing.voteType === voteType) {
        // Same vote: remove it (toggle off)
        await this.voteRepo.remove(existing);
      } else {
        // Different vote: change it
        existing.voteType = voteType;
        await this.voteRepo.save(existing);
      }
    } else {
      // No existing vote: create one
      const vote = this.voteRepo.create({ eventId, userId, voteType });
      await this.voteRepo.save(vote);
    }

    return this.getVoteCounts(eventId, userId);
  }

  /**
   * Get vote counts for an event, and optionally the user's vote.
   */
  async getVoteCounts(eventId: string, userId?: string): Promise<VoteResult> {
    const [likes, dislikes] = await Promise.all([
      this.voteRepo.count({ where: { eventId, voteType: 'like' } }),
      this.voteRepo.count({ where: { eventId, voteType: 'dislike' } }),
    ]);

    let userVote: 'like' | 'dislike' | null = null;
    if (userId) {
      const vote = await this.voteRepo.findOne({
        where: { eventId, userId },
      });
      userVote = vote ? vote.voteType : null;
    }

    return { likes, dislikes, userVote };
  }
}
