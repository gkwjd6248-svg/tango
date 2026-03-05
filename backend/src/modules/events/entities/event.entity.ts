import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('events')
export class TangoEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'event_type' })
  eventType: string;

  @Column({ name: 'venue_name', nullable: true })
  venueName: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ name: 'country_code', length: 2 })
  countryCode: string;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ name: 'start_datetime', type: 'timestamptz' })
  startDatetime: Date;

  @Column({ name: 'end_datetime', type: 'timestamptz', nullable: true })
  endDatetime: Date;

  @Column({ name: 'recurrence_rule', nullable: true })
  recurrenceRule: string;

  @Column({ name: 'source_url', nullable: true })
  sourceUrl: string;

  @Column({ name: 'website_url', nullable: true })
  websiteUrl: string;

  @Column({ name: 'organizer_name', nullable: true })
  organizerName: string;

  @Column({ name: 'organizer_contact', nullable: true })
  organizerContact: string;

  @Column({ name: 'price_info', nullable: true })
  priceInfo: string;

  @Column({ nullable: true })
  currency: string;

  @Column({ name: 'image_urls', type: 'jsonb', nullable: true })
  imageUrls: string[];

  @Column({ name: 'max_participants', type: 'int', nullable: true })
  maxParticipants: number;

  @Column({ name: 'registration_deadline', type: 'timestamptz', nullable: true })
  registrationDeadline: Date;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ default: 'active' })
  status: string;

  @Column({ default: 'user' })
  source: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
