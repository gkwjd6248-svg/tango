import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

// The DB enforces UNIQUE(user_id, likeable_type, likeable_id).
// We mirror that constraint here so TypeORM synchronise mode respects it.
@Entity('likes')
@Unique(['userId', 'likeableType', 'likeableId'])
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Polymorphic discriminator: 'post' | 'comment'
  @Column({ name: 'likeable_type', length: 10 })
  likeableType: 'post' | 'comment';

  // UUID of the target post or comment
  @Column({ name: 'likeable_id', type: 'uuid' })
  likeableId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
