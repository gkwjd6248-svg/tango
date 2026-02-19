import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async findAll(
    @Query('country') countryScope?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postsService.findAll({
      countryScope,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Request() req: { user: { userId: string } },
    @Body() data: {
      contentText: string;
      mediaUrls?: string[];
      mediaType?: string;
      postType?: string;
      countryScope?: string;
    },
  ) {
    return this.postsService.create(req.user.userId, data);
  }
}
