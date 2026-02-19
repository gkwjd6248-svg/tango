import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: { user: { userId: string } }) {
    return this.usersService.findById(req.user.userId);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req: { user: { userId: string } },
    @Body() data: { nickname?: string; bio?: string; danceLevel?: string },
  ) {
    return this.usersService.update(req.user.userId, data);
  }
}
