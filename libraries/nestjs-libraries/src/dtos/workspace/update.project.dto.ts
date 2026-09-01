import { CreateProjectDto } from '@gitroom/nestjs-libraries/dtos/workspace/create.project.dto';

// Same shape as create. clientId stays required so a project can be moved to a
// different client in one call rather than needing a separate endpoint.
export class UpdateProjectDto extends CreateProjectDto {}
