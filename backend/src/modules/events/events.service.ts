import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TangoEvent } from './entities/event.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(TangoEvent)
    private readonly eventRepo: Repository<TangoEvent>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(query: {
    city?: string;
    countryCode?: string;
    eventType?: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    page?: number;
    limit?: number;
  }) {
    const qb = this.eventRepo.createQueryBuilder('event')
      .where('event.status = :status', { status: 'active' });

    if (query.city) {
      qb.andWhere('event.city ILIKE :city', { city: `%${query.city}%` });
    }
    if (query.countryCode) {
      qb.andWhere('event.countryCode = :cc', { cc: query.countryCode });
    }
    if (query.eventType) {
      qb.andWhere('event.eventType = :type', { type: query.eventType });
    }
    if (query.lat && query.lng && query.radiusKm) {
      qb.andWhere(
        `ST_DWithin(event.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)`,
        { lat: query.lat, lng: query.lng, radius: query.radiusKm * 1000 },
      );
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    qb.skip((page - 1) * limit).take(limit);
    qb.orderBy('event.startDatetime', 'ASC');

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<TangoEvent | null> {
    return this.eventRepo.findOne({ where: { id } });
  }

  async create(
    data: {
      title: string;
      eventType: string;
      description?: string;
      venueName: string;
      address?: string;
      city: string;
      countryCode: string;
      startDatetime: string;
      endDatetime?: string;
      latitude?: number;
      longitude?: number;
      organizerName?: string;
      organizerContact?: string;
      priceInfo?: string;
      currency?: string;
      websiteUrl?: string;
      imageUrls?: string[];
      maxParticipants?: number;
      registrationDeadline?: string;
    },
    userId?: string,
  ): Promise<TangoEvent> {
    const event = this.eventRepo.create({
      ...data,
      startDatetime: new Date(data.startDatetime),
      endDatetime: data.endDatetime ? new Date(data.endDatetime) : undefined,
      registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : undefined,
      imageUrls: data.imageUrls ?? undefined,
      maxParticipants: data.maxParticipants ?? undefined,
      status: 'active',
      isVerified: false,
      createdBy: userId ?? undefined,
    });
    return this.eventRepo.save(event);
  }

  async findByCreator(userId: string, page = 1, limit = 20) {
    const qb = this.eventRepo.createQueryBuilder('event')
      .where('event.createdBy = :userId', { userId })
      .orderBy('event.startDatetime', 'DESC');

    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async requireAdmin(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || !user.isAdmin) {
      throw new ForbiddenException('Admin access required');
    }
  }

  async verify(eventId: string, userId: string): Promise<TangoEvent> {
    await this.requireAdmin(userId);
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    event.isVerified = true;
    return this.eventRepo.save(event);
  }

  async remove(eventId: string, userId: string): Promise<void> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check authorization: must be event creator or admin
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (event.createdBy !== userId && !user.isAdmin) {
      throw new ForbiddenException('You do not have permission to delete this event');
    }

    await this.eventRepo.remove(event);
  }
}
