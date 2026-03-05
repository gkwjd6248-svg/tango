import {
  Controller, Get, Param, Query, Post, Body, Delete, Patch,
  UseGuards, Request, HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { VotesService } from './votes.service';
import { ReportsService } from './reports.service';
import { RegistrationsService } from './registrations.service';
import { EventChatService } from './event-chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { TranslateChatMessageDto } from './dto/translate-chat-message.dto';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly votesService: VotesService,
    private readonly reportsService: ReportsService,
    private readonly registrationsService: RegistrationsService,
    private readonly eventChatService: EventChatService,
  ) {}

  // ── Admin: Reports ────────────────────────────────────────────────────
  @Get('admin/reports')
  @UseGuards(JwtAuthGuard)
  async getReports(
    @Query('status') status: string | undefined,
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @Request() req: any,
  ) {
    await this.eventsService.requireAdmin(req.user.userId);
    return this.reportsService.findAll({
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Patch('admin/reports/:reportId/resolve')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async resolveReport(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Body('adminNotes') adminNotes: string | undefined,
    @Request() req: any,
  ) {
    await this.eventsService.requireAdmin(req.user.userId);
    return this.reportsService.resolve(reportId, adminNotes);
  }

  @Patch('admin/reports/:reportId/dismiss')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async dismissReport(
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Body('adminNotes') adminNotes: string | undefined,
    @Request() req: any,
  ) {
    await this.eventsService.requireAdmin(req.user.userId);
    return this.reportsService.dismiss(reportId, adminNotes);
  }

  // ── My events (created by current user) ────────────────────────────────
  @Get('my-events')
  @UseGuards(JwtAuthGuard)
  async getMyEvents(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.eventsService.findByCreator(
      req.user.userId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  // ── Chat rooms (all events user can chat in) ─────────────────────────
  @Get('my-chat-rooms')
  @UseGuards(JwtAuthGuard)
  async getMyChatRooms(@Request() req: any) {
    return this.eventChatService.getChatRooms(req.user.userId);
  }

  // ── Registration: My registrations ─────────────────────────────────────
  @Get('my-registrations')
  @UseGuards(JwtAuthGuard)
  async getMyRegistrations(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.registrationsService.getMyRegistrations(
      req.user.userId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get()
  async findAll(
    @Query('city') city?: string,
    @Query('country') countryCode?: string,
    @Query('type') eventType?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radiusKm?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.eventsService.findAll({
      city,
      countryCode,
      eventType,
      lat: lat ? parseFloat(lat) : undefined,
      lng: lng ? parseFloat(lng) : undefined,
      radiusKm: radiusKm ? parseFloat(radiusKm) : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  // ── Admin: Verify ─────────────────────────────────────────────────────
  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verify(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.eventsService.verify(id, req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.eventsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: CreateEventDto, @Request() req: any) {
    return this.eventsService.create(body, req.user?.userId);
  }

  // ── Registration ──────────────────────────────────────────────────────
  @Post(':id/register')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async registerForEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateRegistrationDto,
    @Request() req: any,
  ) {
    return this.registrationsService.register(id, req.user.userId, body.message);
  }

  @Post(':id/register/cancel')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async cancelRegistration(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.registrationsService.cancel(id, req.user.userId);
  }

  @Get(':id/register/my-status')
  @UseGuards(JwtAuthGuard)
  async getMyRegistrationStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    const registration = await this.registrationsService.getMyRegistration(id, req.user.userId);
    return { registration };
  }

  @Get(':id/registrations/counts')
  async getRegistrationCounts(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.registrationsService.getRegistrationCounts(id);
  }

  @Get(':id/registrations')
  @UseGuards(JwtAuthGuard)
  async getEventRegistrations(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status: string | undefined,
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @Request() req: any,
  ) {
    return this.registrationsService.getEventRegistrations(
      id,
      req.user.userId,
      status,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Patch(':eventId/registrations/:registrationId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateRegistrationStatus(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @Body() body: UpdateRegistrationDto,
    @Request() req: any,
  ) {
    return this.registrationsService.updateStatus(
      registrationId,
      req.user.userId,
      body.status,
      body.adminNotes,
    );
  }

  // ── Chat ──────────────────────────────────────────────────────────────
  @Get(':id/chat')
  @UseGuards(JwtAuthGuard)
  async getChatMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @Request() req: any,
  ) {
    return this.eventChatService.getMessages(
      id,
      req.user.userId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Post(':id/chat')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async sendChatMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SendChatMessageDto,
    @Request() req: any,
  ) {
    return this.eventChatService.sendMessage(id, req.user.userId, body.message);
  }

  @Post(':id/chat/:messageId/translate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async translateChatMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @Body() body: TranslateChatMessageDto,
    @Request() req: any,
  ) {
    return this.eventChatService.translateMessage(
      id,
      messageId,
      req.user.userId,
      body.targetLanguage,
    );
  }

  // ── Report ──────────────────────────────────────────────────────────────
  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  async report(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateReportDto,
    @Request() req: any,
  ) {
    return this.reportsService.create(id, req.user.userId, body);
  }

  // ── Votes ───────────────────────────────────────────────────────────────

  @Post(':id/vote')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async vote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('voteType') voteType: 'like' | 'dislike',
    @Request() req: any,
  ) {
    return this.votesService.toggleVote(id, req.user.userId, voteType);
  }

  @Get(':id/votes')
  async getVotes(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId') userId?: string,
  ) {
    return this.votesService.getVoteCounts(id, userId);
  }

  // ── Delete ──────────────────────────────────────────────────────────────

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    await this.eventsService.remove(id, req.user.userId);
    return { deleted: true };
  }
}
