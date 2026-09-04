import { IsIn, IsOptional, IsString } from 'class-validator';
import { CreateClientDto } from '@gitroom/nestjs-libraries/dtos/workspace/create.client.dto';

export class UpdateClientDto extends CreateClientDto {
  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'ARCHIVED'])
  status?: 'ACTIVE' | 'ARCHIVED';
}
