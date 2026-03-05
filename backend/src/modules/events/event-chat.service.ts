import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EventChatMessage } from './entities/event-chat-message.entity';
import { ChatMessageTranslation } from './entities/chat-message-translation.entity';
import { TangoEvent } from './entities/event.entity';
import { EventRegistration } from './entities/event-registration.entity';

@Injectable()
export class EventChatService {
  constructor(
    @InjectRepository(EventChatMessage)
    private readonly chatRepo: Repository<EventChatMessage>,

    @InjectRepository(ChatMessageTranslation)
    private readonly translationRepo: Repository<ChatMessageTranslation>,

    @InjectRepository(TangoEvent)
    private readonly eventRepo: Repository<TangoEvent>,

    @InjectRepository(EventRegistration)
    private readonly regRepo: Repository<EventRegistration>,
  ) {}

  /** All chat rooms accessible by user (created events + registered events) */
  async getChatRooms(userId: string) {
    // 1. Events created by user
    const myEvents = await this.eventRepo.find({
      where: { createdBy: userId },
    });

    // 2. Events user is registered for with chat-eligible status
    const regs = await this.regRepo.find({
      where: { userId, status: In(['approved', 'pending', 'waitlisted']) },
    });
    const regEventIds = regs.map((r) => r.eventId);
    let regEvents: TangoEvent[] = [];
    if (regEventIds.length > 0) {
      regEvents = await this.eventRepo.find({
        where: { id: In(regEventIds) },
      });
    }

    // 3. Merge & deduplicate
    const eventMap = new Map<string, TangoEvent>();
    for (const e of myEvents) eventMap.set(e.id, e);
    for (const e of regEvents) eventMap.set(e.id, e);
    const allEventIds = Array.from(eventMap.keys());

    if (allEventIds.length === 0) return [];

    // 4. Get last message + count for each event (single query)
    const stats: Array<{ event_id: string; cnt: string; last_at: string }> =
      await this.chatRepo
        .createQueryBuilder('msg')
        .select('msg.event_id', 'event_id')
        .addSelect('COUNT(*)', 'cnt')
        .addSelect('MAX(msg.created_at)', 'last_at')
        .where('msg.event_id IN (:...ids)', { ids: allEventIds })
        .groupBy('msg.event_id')
        .getRawMany();

    const statsMap = new Map(stats.map((s) => [s.event_id, s]));

    // 5. Get last message text per event
    const lastMessages: EventChatMessage[] = [];
    for (const s of stats) {
      const msg = await this.chatRepo.findOne({
        where: { eventId: s.event_id },
        order: { createdAt: 'DESC' },
        relations: ['user'],
      });
      if (msg) lastMessages.push(msg);
    }
    const lastMsgMap = new Map(lastMessages.map((m) => [m.eventId, m]));

    // 6. Build response sorted by last activity
    const rooms = allEventIds.map((id) => {
      const event = eventMap.get(id)!;
      const stat = statsMap.get(id);
      const lastMessage = lastMsgMap.get(id) || null;
      return {
        event,
        lastMessage,
        messageCount: stat ? parseInt(stat.cnt, 10) : 0,
        lastActivity: stat ? stat.last_at : event.createdAt,
      };
    });

    rooms.sort((a, b) =>
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime(),
    );

    return rooms;
  }

  /** Event creator OR registered (approved/pending/waitlisted) user */
  private async assertChatAccess(eventId: string, userId: string): Promise<TangoEvent> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    if (event.createdBy === userId) return event;

    const reg = await this.regRepo.findOne({ where: { eventId, userId } });
    if (!reg || !['approved', 'pending', 'waitlisted'].includes(reg.status)) {
      throw new ForbiddenException('You must be registered for this event to access the chat');
    }
    return event;
  }

  async getMessages(eventId: string, userId: string, page = 1, limit = 50) {
    await this.assertChatAccess(eventId, userId);

    const qb = this.chatRepo
      .createQueryBuilder('msg')
      .leftJoinAndSelect('msg.user', 'user')
      .where('msg.eventId = :eventId', { eventId })
      .orderBy('msg.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.reverse(), // chronological order for display
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async sendMessage(eventId: string, userId: string, messageText: string): Promise<EventChatMessage> {
    await this.assertChatAccess(eventId, userId);

    const msg = this.chatRepo.create({
      eventId,
      userId,
      message: messageText,
    });
    const saved = await this.chatRepo.save(msg);

    return this.chatRepo.findOne({
      where: { id: saved.id },
      relations: ['user'],
    }) as Promise<EventChatMessage>;
  }

  async translateMessage(eventId: string, messageId: string, userId: string, targetLanguage: string) {
    await this.assertChatAccess(eventId, userId);

    // Check cache
    const cached = await this.translationRepo.findOne({
      where: { messageId, targetLanguage },
    });
    if (cached) {
      return {
        id: cached.id,
        messageId: cached.messageId,
        targetLanguage: cached.targetLanguage,
        translatedText: cached.translatedText,
        fromCache: true,
      };
    }

    const msg = await this.chatRepo.findOne({ where: { id: messageId, eventId } });
    if (!msg) throw new NotFoundException('Message not found');

    // Mock translation (same pattern as TranslationsService)
    const translatedText = `[${targetLanguage.toUpperCase()}] ${msg.message}`;

    const record = this.translationRepo.create({
      messageId,
      targetLanguage,
      translatedText,
      translationProvider: 'deepl',
    });
    const saved = await this.translationRepo.save(record);

    return {
      id: saved.id,
      messageId: saved.messageId,
      targetLanguage: saved.targetLanguage,
      translatedText: saved.translatedText,
      fromCache: false,
    };
  }
}
