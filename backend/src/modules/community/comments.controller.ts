import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class CreateCommentDto {
  contentText: string;
  parentCommentId?: string;
}

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * GET /posts/:postId/comments
   * Returns paginated comments for a post (public endpoint).
   */
  @Get('posts/:postId/comments')
  async findByPost(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.commentsService.findByPost(
      postId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  /**
   * POST /posts/:postId/comments
   * Create a new comment on a post. Authentication required.
   */
  @Post('posts/:postId/comments')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() dto: CreateCommentDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.commentsService.create(
      req.user.userId,
      postId,
      dto.contentText,
      dto.parentCommentId,
    );
  }

  /**
   * DELETE /comments/:id
   * Soft-delete a comment. Only the comment author may delete it.
   */
  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { userId: string } },
  ) {
    await this.commentsService.delete(req.user.userId, id);
  }
}
