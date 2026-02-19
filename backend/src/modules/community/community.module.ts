import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { CommunityPost } from './entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CommunityPost])],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class CommunityModule {}
