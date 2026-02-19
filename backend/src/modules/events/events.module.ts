import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { TangoEvent } from './entities/event.entity';
import { Bookmark } from './entities/bookmark.entity';

// Services
import { EventsService } from './events.service';
import { BookmarksService } from './bookmarks.service';

// Controllers
import { EventsController } from './events.controller';
import { BookmarksController } from './bookmarks.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TangoEvent, Bookmark]),
  ],
  controllers: [EventsController, BookmarksController],
  providers: [EventsService, BookmarksService],
  exports: [EventsService, BookmarksService],
})
export class EventsModule {}
