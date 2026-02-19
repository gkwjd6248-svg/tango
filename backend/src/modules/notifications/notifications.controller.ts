import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthRequest {
  user: { userId: string };
}

@Controller('notifications')
@UseGuards(JwtAuthGuard) // All endpoints in this controller require authentication
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /notifications
   * Return the authenticated user's notifications, paginated, newest first.
   *
   * Query params:
   *   page  - Page number (default: 1)
   *   limit - Items per page (default: 20)
   */
  @Get()
  async getUserNotifications(
    @Request() req: AuthRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.getUserNotifications(
      req.user.userId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  /**
   * GET /notifications/unread-count
   * Return the count of unread notifications for the authenticated user.
   *
   * NOTE: This route must be declared BEFORE `:id` routes so that NestJS
   * does not treat "unread-count" as a notification ID.
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req: AuthRequest) {
    return this.notificationsService.getUnreadCount(req.user.userId);
  }

  /**
   * PATCH /notifications/read-all
   * Mark all notifications as read for the authenticated user.
   *
   * NOTE: Declared before `:id/read` to prevent route shadowing.
   */
  @Patch('read-all')
  async markAllAsRead(@Request() req: AuthRequest) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  /**
   * PATCH /notifications/:id/read
   * Mark a single notification as read for the authenticated user.
   *
   * Params:
   *   id - UUID of the notification
   */
  @Patch(':id/read')
  async markAsRead(
    @Request() req: AuthRequest,
    @Param('id') notificationId: string,
  ) {
    return this.notificationsService.markAsRead(req.user.userId, notificationId);
  }
}
