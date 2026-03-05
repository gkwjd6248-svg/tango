import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SocialLoginDto } from './dto/social-login.dto';
import { SocialAuthService } from './social-auth.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly socialAuthService: SocialAuthService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      email: dto.email,
      nickname: dto.nickname,
      countryCode: dto.countryCode,
      preferredLanguage: dto.preferredLanguage || 'en',
      passwordHash,
    });

    const token = this.generateToken(user.id);
    return { user: { id: user.id, email: user.email, nickname: user.nickname }, token };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user.id);
    return { user: { id: user.id, email: user.email, nickname: user.nickname }, token };
  }

  async socialLogin(dto: SocialLoginDto) {
    const profile = await this.socialAuthService.verify(dto.provider, dto.token);

    // 1. Look up by provider + providerId
    let user = await this.usersService.findByProvider(profile.provider, profile.providerId);
    if (user) {
      const token = this.generateToken(user.id);
      return {
        user: { id: user.id, email: user.email, nickname: user.nickname },
        token,
        isNewUser: false,
      };
    }

    // 2. Check if email exists (link accounts)
    if (profile.email) {
      const existingByEmail = await this.usersService.findByEmail(profile.email);
      if (existingByEmail) {
        await this.usersService.update(existingByEmail.id, {
          authProvider: profile.provider,
          authProviderId: profile.providerId,
          ...(profile.avatarUrl && !existingByEmail.avatarUrl
            ? { avatarUrl: profile.avatarUrl }
            : {}),
        });
        const token = this.generateToken(existingByEmail.id);
        return {
          user: {
            id: existingByEmail.id,
            email: existingByEmail.email,
            nickname: existingByEmail.nickname,
          },
          token,
          isNewUser: false,
        };
      }
    }

    // 3. Create new user
    const nickname =
      dto.nickname || profile.nickname || `tanguero_${Date.now().toString(36)}`;
    const countryCode = dto.countryCode || 'XX';

    user = await this.usersService.create({
      email: profile.email || `${profile.provider}_${profile.providerId}@noemail.tango`,
      nickname,
      countryCode,
      authProvider: profile.provider,
      authProviderId: profile.providerId,
      avatarUrl: profile.avatarUrl || undefined,
      preferredLanguage: 'en',
    });

    const token = this.generateToken(user.id);
    return {
      user: { id: user.id, email: user.email, nickname: user.nickname },
      token,
      isNewUser: true,
    };
  }

  private generateToken(userId: string): string {
    return this.jwtService.sign({ sub: userId });
  }
}
