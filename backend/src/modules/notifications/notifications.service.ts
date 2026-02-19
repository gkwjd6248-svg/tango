import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

export interface PaginatedNotifications {
  items: Notification[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  /**
   * Retrieve paginated notifications for a user, newest first.
   * Also returns the current unread count in the same response for convenience.
   */
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedNotifications> {
    const [items, total] = await this.notificationRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const unreadCount = await this.notificationRepo.count({
      where: { userId, isRead: false },
    });

    return { items, total, page, limit, unreadCount };
  }

  /**
   * Mark a single notification as read.
   * Throws NotFoundException if the notification does not belong to the user.
   */
  async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException(
        `Notification ${notificationId} not found for user ${userId}`,
      );
    }

    if (!notification.isRead) {
      notification.isRead = true;
      await this.notificationRepo.save(notification);
    }

    return notification;
  }

  /**
   * Mark every unread notification for the user as read in a single query.
   * Returns the number of rows updated.
   */
  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notificationRepo
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true })
      .where('user_id = :userId', { userId })
      .andWhere('is_read = :isRead', { isRead: false })
      .execute();

    return { updated: result.affected ?? 0 };
  }

  /**
   * Create and persist a new notification for the specified user.
   * Called internally by other services when noteworthy events occur.
   */
  async createNotification(
    userId: string,
    type: string,
    title: string,
    body?: string,
    data?: Record<string, unknown>,
  ): Promise<Notification> {
    const notification = this.notificationRepo.create({
      userId,
      type,
      title,
      body: body || undefined,
      data: data ?? {},
      isRead: false,
    } as Partial<Notification>);

    return this.notificationRepo.save(notification) as Promise<Notification>;
  }

  /**
   * Return the count of unread notifications for the user.
   */
  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepo.count({
      where: { userId, isRead: false },
    });

    return { count };
  }
}
