import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';

export interface SocialProfile {
  provider: string;
  providerId: string;
  email: string | null;
  nickname: string | null;
  avatarUrl: string | null;
}

@Injectable()
export class SocialAuthService {
  private googleClient: OAuth2Client;
  private appleJwksClient: jwksClient.JwksClient;

  constructor(private readonly config: ConfigService) {
    this.googleClient = new OAuth2Client(config.get('google.clientId'));
    this.appleJwksClient = jwksClient({
      jwksUri: 'https://appleid.apple.com/auth/keys',
      cache: true,
      cacheMaxAge: 86400000,
    });
  }

  async verify(provider: string, token: string): Promise<SocialProfile> {
    switch (provider) {
      case 'google':
        return this.verifyGoogle(token);
      case 'kakao':
        return this.verifyKakao(token);
      case 'naver':
        return this.verifyNaver(token);
      case 'apple':
        return this.verifyApple(token);
      default:
        throw new UnauthorizedException(`Unsupported provider: ${provider}`);
    }
  }

  private async verifyGoogle(idToken: string): Promise<SocialProfile> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.config.get('google.clientId'),
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.sub) {
        throw new UnauthorizedException('Invalid Google token');
      }
      return {
        provider: 'google',
        providerId: payload.sub,
        email: payload.email || null,
        nickname: payload.name || null,
        avatarUrl: payload.picture || null,
      };
    } catch {
      throw new UnauthorizedException('Google token verification failed');
    }
  }

  private async verifyKakao(accessToken: string): Promise<SocialProfile> {
    try {
      const { data } = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!data.id) {
        throw new UnauthorizedException('Invalid Kakao token');
      }
      const account = data.kakao_account || {};
      const profile = account.profile || {};
      return {
        provider: 'kakao',
        providerId: String(data.id),
        email: account.email || null,
        nickname: profile.nickname || null,
        avatarUrl: profile.profile_image_url || null,
      };
    } catch {
      throw new UnauthorizedException('Kakao token verification failed');
    }
  }

  private async verifyNaver(accessToken: string): Promise<SocialProfile> {
    try {
      const { data } = await axios.get('https://openapi.naver.com/v1/nid/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (data.resultcode !== '00' || !data.response?.id) {
        throw new UnauthorizedException('Invalid Naver token');
      }
      const r = data.response;
      return {
        provider: 'naver',
        providerId: r.id,
        email: r.email || null,
        nickname: r.nickname || r.name || null,
        avatarUrl: r.profile_image || null,
      };
    } catch {
      throw new UnauthorizedException('Naver token verification failed');
    }
  }

  private async verifyApple(idToken: string): Promise<SocialProfile> {
    try {
      const decoded = jwt.decode(idToken, { complete: true });
      if (!decoded || typeof decoded === 'string') {
        throw new UnauthorizedException('Invalid Apple token format');
      }
      const kid = decoded.header.kid;

      const key = await this.appleJwksClient.getSigningKey(kid);
      const publicKey = key.getPublicKey();

      const payload = jwt.verify(idToken, publicKey, {
        algorithms: ['RS256'],
        issuer: 'https://appleid.apple.com',
        audience: [
          this.config.get('apple.bundleId'),
          this.config.get('apple.serviceId'),
        ].filter(Boolean),
      }) as jwt.JwtPayload;

      if (!payload.sub) {
        throw new UnauthorizedException('Invalid Apple token');
      }
      return {
        provider: 'apple',
        providerId: payload.sub,
        email: payload.email || null,
        nickname: null,
        avatarUrl: null,
      };
    } catch {
      throw new UnauthorizedException('Apple token verification failed');
    }
  }
}
