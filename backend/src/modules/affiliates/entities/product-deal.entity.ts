import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('product_deals')
export class ProductDeal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'product_category', length: 20 })
  productCategory: string;

  @Column({ name: 'original_price', type: 'decimal', precision: 10, scale: 2 })
  originalPrice: number;

  @Column({ name: 'deal_price', type: 'decimal', precision: 10, scale: 2 })
  dealPrice: number;

  @Column({ length: 3, default: 'USD' })
  currency: string;

  // discount_percentage is a GENERATED ALWAYS column in PostgreSQL.
  // We mark it as nullable so TypeORM does not attempt to INSERT it,
  // and use { insert: false, update: false } to keep it read-only.
  @Column({
    name: 'discount_percentage',
    type: 'int',
    nullable: true,
    insert: false,
    update: false,
  })
  discountPercentage: number;

  @Column({ name: 'affiliate_provider', length: 20 })
  affiliateProvider: string;

  @Column({ name: 'affiliate_url', type: 'text' })
  affiliateUrl: string;

  @Column({ name: 'affiliate_id', nullable: true })
  affiliateId: string;

  @Column({ name: 'image_urls', type: 'jsonb', nullable: true, default: '[]' })
  imageUrls: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
