import { IsString, IsIn, IsOptional, MinLength, MaxLength } from 'class-validator';

export class SocialLoginDto {
  @IsString()
  @IsIn(['google', 'kakao', 'naver', 'apple'])
  provider: 'google' | 'kakao' | 'naver' | 'apple';

  @IsString()
  token: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  nickname?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  countryCode?: string;
}
