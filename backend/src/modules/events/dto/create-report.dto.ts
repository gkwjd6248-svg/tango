import { IsString, IsNotEmpty, IsOptional, IsIn, MaxLength } from 'class-validator';

const VALID_REASONS = ['spam', 'misleading', 'duplicate', 'inappropriate', 'other'] as const;

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(VALID_REASONS)
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
