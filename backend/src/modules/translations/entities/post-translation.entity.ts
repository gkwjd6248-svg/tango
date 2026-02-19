import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { CommunityPost } from '../../community/entities/post.entity';

@Entity('post_translations')
@Unique(['postId', 'targetLanguage']) // enforce DB-level uniqueness per post + language
export class PostTranslation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'post_id' })
  postId: string;

  @ManyToOne(() => CommunityPost, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: CommunityPost;

  @Column({ name: 'target_language', length: 5 })
  targetLanguage: string;

  @Column({ name: 'translated_text', type: 'text' })
  translatedText: string;

  @Column({ name: 'translation_provider', length: 20, default: 'deepl' })
  translationProvider: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
