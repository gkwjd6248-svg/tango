import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash', nullable: true })
  passwordHash: string;

  @Column({ length: 30 })
  nickname: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ name: 'country_code', length: 2 })
  countryCode: string;

  @Column({ name: 'preferred_language', length: 5, default: 'en' })
  preferredLanguage: string;

  @Column({ name: 'auth_provider', default: 'local' })
  authProvider: string;

  @Column({ name: 'auth_provider_id', nullable: true })
  authProviderId: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ name: 'dance_level', default: 'beginner' })
  danceLevel: string;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'is_admin', default: false })
  isAdmin: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
