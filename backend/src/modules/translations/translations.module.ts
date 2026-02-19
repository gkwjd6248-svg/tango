import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TranslationsController } from './translations.controller';
import { TranslationsService } from './translations.service';
import { PostTranslation } from './entities/post-translation.entity';
import { CommunityPost } from '../community/entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PostTranslation, CommunityPost])],
  controllers: [TranslationsController],
  providers: [TranslationsService],
  exports: [TranslationsService],
})
export class TranslationsModule {}
