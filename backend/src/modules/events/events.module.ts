import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { TangoEvent } from './entities/event.entity';
import { Bookmark } from './entities/bookmark.entity';
import { EventVote } from './entities/event-vote.entity';
import { EventReport } from './entities/event-report.entity';
import { EventRegistration } from './entities/event-registration.entity';
import { EventChatMessage } from './entities/event-chat-message.entity';
import { ChatMessageTranslation } from './entities/chat-message-translation.entity';
import { User } from '../users/entities/user.entity';

// Services
import { EventsService } from './events.service';
import { BookmarksService } from './bookmarks.service';
import { VotesService } from './votes.service';
import { ReportsService } from './reports.service';
import { RegistrationsService } from './registrations.service';
import { EventChatService } from './event-chat.service';

// Controllers
import { EventsController } from './events.controller';
import { BookmarksController } from './bookmarks.controller';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TangoEvent, Bookmark, EventVote, EventReport, EventRegistration,
      EventChatMessage, ChatMessageTranslation, User,
    ]),
  ],
  controllers: [EventsController, BookmarksController, UploadsController],
  providers: [EventsService, BookmarksService, VotesService, ReportsService, RegistrationsService, EventChatService],
  exports: [EventsService, BookmarksService, VotesService, ReportsService, RegistrationsService, EventChatService],
})
export class EventsModule {}
