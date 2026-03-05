import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('event_reports')
export class EventReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @Column({ name: 'reporter_id' })
  reporterId: string;

  @Column({ length: 50 })
  reason: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 20, default: 'pending' })
  status: string;

  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  adminNotes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
