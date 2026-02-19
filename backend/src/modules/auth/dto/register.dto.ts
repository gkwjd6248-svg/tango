import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsIn } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(30)
  nickname: string;

  @IsString()
  @MinLength(2)
  @MaxLength(2)
  countryCode: string;

  @IsOptional()
  @IsString()
  @IsIn(['en', 'ko', 'es', 'ja', 'zh', 'fr', 'de', 'it', 'pt', 'ru', 'tr', 'ar'])
  preferredLanguage?: string;
}
