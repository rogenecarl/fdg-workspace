import {
  IsDateString,
  IsDefined,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export const PROJECT_STATUSES = [
  'PLANNING',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
] as const;

export type ProjectStatusValue = (typeof PROJECT_STATUSES)[number];

export class CreateProjectDto {
  @IsDefined()
  @IsUUID()
  clientId: string;

  @IsDefined()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(PROJECT_STATUSES as unknown as string[])
  status?: ProjectStatusValue;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
