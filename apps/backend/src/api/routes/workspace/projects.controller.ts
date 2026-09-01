import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Organization } from '@prisma/client';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { ProjectsService } from '@gitroom/nestjs-libraries/database/prisma/workspace/projects.service';
import { CreateProjectDto } from '@gitroom/nestjs-libraries/dtos/workspace/create.project.dto';
import { UpdateProjectDto } from '@gitroom/nestjs-libraries/dtos/workspace/update.project.dto';

@ApiTags('Workspace Projects')
@Controller('/workspace/projects')
export class ProjectsController {
  constructor(private _projectsService: ProjectsService) {}

  @Get('/')
  async getProjects(
    @GetOrgFromRequest() org: Organization,
    @Query('clientId') clientId?: string
  ) {
    return this._projectsService.getProjects(org.id, clientId);
  }

  @Get('/:id')
  async getProject(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    const project = await this._projectsService.getProject(org.id, id);

    if (!project) {
      throw new HttpException({ msg: 'Project not found' }, 404);
    }

    return project;
  }

  @Post('/')
  async createProject(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CreateProjectDto
  ) {
    const project = await this._projectsService.createProject(org.id, body);

    if (!project) {
      throw new HttpException({ msg: 'Client not found' }, 404);
    }

    return project;
  }

  @Put('/:id')
  async updateProject(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: UpdateProjectDto
  ) {
    const project = await this._projectsService.updateProject(org.id, id, body);

    if (!project) {
      throw new HttpException({ msg: 'Project not found' }, 404);
    }

    return project;
  }

  @Delete('/:id')
  async deleteProject(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    await this._projectsService.deleteProject(org.id, id);
    return { deleted: true };
  }
}
