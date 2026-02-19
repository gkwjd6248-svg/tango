import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bookmark } from './entities/bookmark.entity';
import { TangoEvent } from './entities/event.entity';

export interface ToggleBookmarkResult {
  bookmarked: boolean; // true = bookmark created, false = bookmark removed
}

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(Bookmark)
    private readonly bookmarkRepo: Repository<Bookmark>,

    @InjectRepository(TangoEvent)
    private readonly eventRepo: Repository<TangoEvent>,
  ) {}

  /**
   * Toggle a bookmark for the given user/event pair.
   * Returns whether the event is now bookmarked after the operation.
   */
  async toggle(
    userId: string,
    eventId: string,
  ): Promise<ToggleBookmarkResult> {
    // Verify the event exists before creating a bookmark
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const existing = await this.bookmarkRepo.findOne({
      where: { userId, eventId },
    });

    if (existing) {
      await this.bookmarkRepo.remove(existing);
      return { bookmarked: false };
    }

    const bookmark = this.bookmarkRepo.create({ userId, eventId });
    await this.bookmarkRepo.save(bookmark);
    return { bookmarked: true };
  }

  /**
   * Return a paginated list of events the user has bookmarked, ordered newest first.
   */
  async getUserBookmarks(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{
    items: Bookmark[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [items, total] = await this.bookmarkRepo
      .createQueryBuilder('bookmark')
      .leftJoinAndSelect('bookmark.event', 'event')
      .where('bookmark.userId = :userId', { userId })
      // Only return bookmarks for active events
      .andWhere('event.status = :status', { status: 'active' })
      .orderBy('bookmark.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit };
  }

  /**
   * Check whether a specific event is bookmarked by the user.
   */
  async isBookmarked(
    userId: string,
    eventId: string,
  ): Promise<{ bookmarked: boolean }> {
    const exists = await this.bookmarkRepo.findOne({
      where: { userId, eventId },
    });
    return { bookmarked: Boolean(exists) };
  }
}
