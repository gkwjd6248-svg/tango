import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TangoEvent } from './entities/event.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(TangoEvent)
    private readonly eventRepo: Repository<TangoEvent>,
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
    return { items, total, page, limit };
  }

  async findById(id: string): Promise<TangoEvent | null> {
    return this.eventRepo.findOne({ where: { id } });
  }
}
