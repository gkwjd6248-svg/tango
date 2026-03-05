import {
  Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventRegistration } from './entities/event-registration.entity';
import { TangoEvent } from './entities/event.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectRepository(EventRegistration)
    private readonly regRepo: Repository<EventRegistration>,

    @InjectRepository(TangoEvent)
    private readonly eventRepo: Repository<TangoEvent>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async register(eventId: string, userId: string, message?: string): Promise<EventRegistration> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    if (event.createdBy === userId) {
      throw new BadRequestException('You cannot register for your own event');
    }

    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      throw new BadRequestException('Registration deadline has passed');
    }

    const existing = await this.regRepo.findOne({ where: { eventId, userId } });
    if (existing && existing.status !== 'cancelled') {
      throw new ConflictException('You are already registered for this event');
    }

    // If previously cancelled, allow re-registration
    if (existing && existing.status === 'cancelled') {
      let status: 'approved' | 'waitlisted' = 'approved';
      if (event.maxParticipants) {
        const activeCount = await this.regRepo
          .createQueryBuilder('reg')
          .where('reg.eventId = :eventId', { eventId })
          .andWhere('reg.status IN (:...statuses)', { statuses: ['approved', 'pending'] })
          .getCount();
        if (activeCount >= event.maxParticipants) {
          status = 'waitlisted';
        }
      }
      existing.status = status;
      existing.message = message ?? existing.message;
      existing.adminNotes = null as any;
      return this.regRepo.save(existing);
    }

    let status: 'approved' | 'waitlisted' = 'approved';
    if (event.maxParticipants) {
      const activeCount = await this.regRepo
        .createQueryBuilder('reg')
        .where('reg.eventId = :eventId', { eventId })
        .andWhere('reg.status IN (:...statuses)', { statuses: ['approved', 'pending'] })
        .getCount();
      if (activeCount >= event.maxParticipants) {
        status = 'waitlisted';
      }
    }

    const reg = this.regRepo.create({
      eventId,
      userId,
      status,
      message: message ?? undefined,
    } as Partial<EventRegistration>);
    return this.regRepo.save(reg);
  }

  async cancel(eventId: string, userId: string): Promise<EventRegistration> {
    const reg = await this.regRepo.findOne({ where: { eventId, userId } });
    if (!reg) throw new NotFoundException('Registration not found');
    if (reg.status === 'cancelled') throw new BadRequestException('Already cancelled');
    reg.status = 'cancelled';
    return this.regRepo.save(reg);
  }

  async getMyRegistration(eventId: string, userId: string): Promise<EventRegistration | null> {
    return this.regRepo.findOne({ where: { eventId, userId } });
  }

  async getMyRegistrations(userId: string, page = 1, limit = 20) {
    const qb = this.regRepo
      .createQueryBuilder('reg')
      .leftJoinAndMapOne('reg.event', TangoEvent, 'event', 'event.id = reg.eventId')
      .where('reg.userId = :userId', { userId })
      .orderBy('reg.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getEventRegistrations(
    eventId: string,
    userId: string,
    statusFilter?: string,
    page = 1,
    limit = 20,
  ) {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (event.createdBy !== userId && !user.isAdmin) {
      throw new ForbiddenException('Only the event creator can view registrations');
    }

    const qb = this.regRepo
      .createQueryBuilder('reg')
      .leftJoinAndMapOne('reg.user', User, 'user', 'user.id = reg.userId')
      .where('reg.eventId = :eventId', { eventId })
      .orderBy('reg.createdAt', 'ASC');

    if (statusFilter) {
      qb.andWhere('reg.status = :status', { status: statusFilter });
    }

    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateStatus(
    registrationId: string,
    userId: string,
    newStatus: 'approved' | 'rejected',
    adminNotes?: string,
  ): Promise<EventRegistration> {
    const reg = await this.regRepo.findOne({ where: { id: registrationId } });
    if (!reg) throw new NotFoundException('Registration not found');

    const event = await this.eventRepo.findOne({ where: { id: reg.eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (event.createdBy !== userId && !user.isAdmin) {
      throw new ForbiddenException('Only the event creator can manage registrations');
    }

    if (newStatus === 'approved' && event.maxParticipants) {
      const approvedCount = await this.regRepo.count({
        where: { eventId: reg.eventId, status: 'approved' as any },
      });
      if (approvedCount >= event.maxParticipants) {
        throw new BadRequestException('Event is at full capacity');
      }
    }

    reg.status = newStatus;
    if (adminNotes) reg.adminNotes = adminNotes;
    return this.regRepo.save(reg);
  }

  async getRegistrationCounts(eventId: string): Promise<{
    approved: number;
    pending: number;
    waitlisted: number;
    total: number;
  }> {
    const [approved, pending, waitlisted] = await Promise.all([
      this.regRepo.count({ where: { eventId, status: 'approved' as any } }),
      this.regRepo.count({ where: { eventId, status: 'pending' as any } }),
      this.regRepo.count({ where: { eventId, status: 'waitlisted' as any } }),
    ]);
    return { approved, pending, waitlisted, total: approved + pending + waitlisted };
  }
}
