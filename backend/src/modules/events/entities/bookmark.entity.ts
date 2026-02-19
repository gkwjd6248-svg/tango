import {
  Entity,
  PrimaryColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TangoEvent } from './event.entity';

// The DB uses a composite primary key (user_id, event_id).
// TypeORM models this with @PrimaryColumn on both FK columns.
@Entity('user_event_bookmarks')
export class Bookmark {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @PrimaryColumn({ name: 'event_id', type: 'uuid' })
  eventId: string;

  @ManyToOne(() => TangoEvent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: TangoEvent;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
