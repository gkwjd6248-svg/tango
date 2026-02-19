import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { CommunityPost } from './entities/post.entity';
import { Comment } from './entities/comment.entity';
import { Like } from './entities/like.entity';

// Services
import { PostsService } from './posts.service';
import { CommentsService } from './comments.service';
import { LikesService } from './likes.service';

// Controllers
import { PostsController } from './posts.controller';
import { CommentsController } from './comments.controller';
import { LikesController } from './likes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommunityPost, Comment, Like]),
  ],
  controllers: [PostsController, CommentsController, LikesController],
  providers: [PostsService, CommentsService, LikesService],
  exports: [PostsService, CommentsService, LikesService],
})
export class CommunityModule {}
