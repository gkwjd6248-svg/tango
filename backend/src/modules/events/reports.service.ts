import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventReport } from './entities/event-report.entity';
import { TangoEvent } from './entities/event.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(EventReport)
    private readonly reportRepo: Repository<EventReport>,

    @InjectRepository(TangoEvent)
    private readonly eventRepo: Repository<TangoEvent>,
  ) {}

  async create(
    eventId: string,
    reporterId: string,
    data: { reason: string; description?: string },
  ): Promise<EventReport> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const report = this.reportRepo.create({
      eventId,
      reporterId,
      reason: data.reason,
      description: data.description ?? undefined,
    } as Partial<EventReport>);
    return this.reportRepo.save(report);
  }

  async findAll(query: { status?: string; page?: number; limit?: number }) {
    const qb = this.reportRepo.createQueryBuilder('report')
      .orderBy('report.createdAt', 'DESC');

    if (query.status) {
      qb.where('report.status = :status', { status: query.status });
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async resolve(reportId: string, adminNotes?: string): Promise<EventReport> {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');
    report.status = 'resolved';
    if (adminNotes) report.adminNotes = adminNotes;
    return this.reportRepo.save(report);
  }

  async dismiss(reportId: string, adminNotes?: string): Promise<EventReport> {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');
    report.status = 'dismissed';
    if (adminNotes) report.adminNotes = adminNotes;
    return this.reportRepo.save(report);
  }
}
