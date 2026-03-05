import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class TranslateChatMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  targetLanguage: string;
}
