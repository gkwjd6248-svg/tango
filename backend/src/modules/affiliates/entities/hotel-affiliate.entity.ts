import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TangoEvent } from '../../events/entities/event.entity';

@Entity('hotel_affiliates')
export class HotelAffiliate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => TangoEvent)
  @JoinColumn({ name: 'event_id' })
  event: TangoEvent;

  @Column({ name: 'hotel_name', length: 300 })
  hotelName: string;

  @Column({ name: 'hotel_address', type: 'text', nullable: true })
  hotelAddress: string;

  // PostGIS geography column — stored as text; raw queries handle spatial ops
  @Column({
    name: 'location',
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
    select: false, // exclude from default SELECT to avoid serialisation issues
  })
  location: string;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ name: 'distance_from_event_meters', type: 'int', nullable: true })
  distanceFromEventMeters: number;

  @Column({ name: 'price_per_night_min', type: 'decimal', precision: 10, scale: 2, nullable: true })
  pricePerNightMin: number;

  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'decimal', precision: 2, scale: 1, nullable: true })
  rating: number;

  @Column({ name: 'review_count', default: 0 })
  reviewCount: number;

  @Column({ name: 'affiliate_provider', length: 20 })
  affiliateProvider: string;

  @Column({ name: 'affiliate_url', type: 'text' })
  affiliateUrl: string;

  @Column({ name: 'affiliate_id', nullable: true })
  affiliateId: string;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string;

  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  amenities: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
