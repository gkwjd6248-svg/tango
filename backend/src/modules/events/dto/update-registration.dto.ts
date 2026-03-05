import { IsString, IsIn, IsOptional, MaxLength } from 'class-validator';

export class UpdateRegistrationDto {
  @IsString()
  @IsIn(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNotes?: string;
}
