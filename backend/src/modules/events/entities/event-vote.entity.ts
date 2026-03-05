import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

@Entity('event_votes')
@Unique(['eventId', 'userId'])
export class EventVote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'vote_type' })
  voteType: 'like' | 'dislike';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
