import {
  IsBoolean,
  IsDateString,
  IsDefined,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export const TASK_STATUSES = [
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'DONE',
] as const;

export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

export type TaskStatusValue = (typeof TASK_STATUSES)[number];
export type TaskPriorityValue = (typeof TASK_PRIORITIES)[number];

export class CreateTaskDto {
  @IsDefined()
  @IsUUID()
  projectId: string;

  @IsDefined()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(TASK_STATUSES as unknown as string[])
  status?: TaskStatusValue;

  @IsOptional()
  @IsString()
  @IsIn(TASK_PRIORITIES as unknown as string[])
  priority?: TaskPriorityValue;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsBoolean()
  visibleToClient?: boolean;
}
