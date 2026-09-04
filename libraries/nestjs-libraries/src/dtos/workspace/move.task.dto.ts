import { IsDefined, IsIn, IsInt, IsString, Min } from 'class-validator';
import { TASK_STATUSES, TaskStatusValue } from '@gitroom/nestjs-libraries/dtos/workspace/create.task.dto';

export class MoveTaskDto {
  @IsDefined()
  @IsString()
  @IsIn(TASK_STATUSES as unknown as string[])
  status: TaskStatusValue;

  // Target index within the destination column. Values beyond the column
  // length clamp to the end rather than erroring.
  @IsDefined()
  @IsInt()
  @Min(0)
  position: number;
}
