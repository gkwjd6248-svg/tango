import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { EventChatMessage } from './event-chat-message.entity';

@Entity('chat_message_translations')
@Unique(['messageId', 'targetLanguage'])
export class ChatMessageTranslation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'message_id' })
  messageId: string;

  @ManyToOne(() => EventChatMessage, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: EventChatMessage;

  @Column({ name: 'target_language', length: 5 })
  targetLanguage: string;

  @Column({ name: 'translated_text', type: 'text' })
  translatedText: string;

  @Column({ name: 'translation_provider', length: 20, default: 'deepl' })
  translationProvider: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
