import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { LikesService, LikeableType } from './likes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class ToggleLikeDto {
  likeableType: LikeableType;
  likeableId: string;
}

@Controller('likes')
@UseGuards(JwtAuthGuard)
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  /**
   * POST /likes
   * Body: { likeableType: 'post' | 'comment', likeableId: UUID }
   * Toggles the like on or off and returns the new state.
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async toggle(
    @Body() dto: ToggleLikeDto,
    @Request() req: { user: { userId: string } },
  ) {
    if (!dto.likeableType || !dto.likeableId) {
      throw new BadRequestException('likeableType and likeableId are required');
    }
    return this.likesService.toggle(
      req.user.userId,
      dto.likeableType,
      dto.likeableId,
    );
  }

  /**
   * GET /likes/check?likeableType=post&likeableId=<uuid>
   * Returns whether the authenticated user has liked the given entity.
   */
  @Get('check')
  async check(
    @Query('likeableType') likeableType: string,
    @Query('likeableId') likeableId: string,
    @Request() req: { user: { userId: string } },
  ) {
    if (!likeableType || !likeableId) {
      throw new BadRequestException(
        'likeableType and likeableId query params are required',
      );
    }
    if (likeableType !== 'post' && likeableType !== 'comment') {
      throw new BadRequestException(
        "likeableType must be 'post' or 'comment'",
      );
    }
    return this.likesService.isLiked(
      req.user.userId,
      likeableType as LikeableType,
      likeableId,
    );
  }
}
