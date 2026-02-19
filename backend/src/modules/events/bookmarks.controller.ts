import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  /**
   * POST /events/:eventId/bookmark
   * Toggles the bookmark for the authenticated user on the specified event.
   */
  @Post(':eventId/bookmark')
  @HttpCode(HttpStatus.OK)
  async toggle(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.bookmarksService.toggle(req.user.userId, eventId);
  }

  /**
   * GET /events/bookmarks
   * Returns a paginated list of events the authenticated user has bookmarked.
   *
   * NOTE: This route must be declared BEFORE GET /events/:eventId/bookmark/check
   * so that the literal segment "bookmarks" is matched first and not captured
   * as an :eventId parameter.
   */
  @Get('bookmarks')
  async getUserBookmarks(
    @Request() req: { user: { userId: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bookmarksService.getUserBookmarks(
      req.user.userId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  /**
   * GET /events/:eventId/bookmark/check
   * Returns whether the authenticated user has bookmarked the given event.
   */
  @Get(':eventId/bookmark/check')
  async check(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.bookmarksService.isBookmarked(req.user.userId, eventId);
  }
}
