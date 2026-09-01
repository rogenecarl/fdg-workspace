import { Injectable } from '@nestjs/common';
import { ProjectsRepository } from '@gitroom/nestjs-libraries/database/prisma/workspace/projects.repository';
import { CreateProjectDto } from '@gitroom/nestjs-libraries/dtos/workspace/create.project.dto';
import { UpdateProjectDto } from '@gitroom/nestjs-libraries/dtos/workspace/update.project.dto';

@Injectable()
export class ProjectsService {
  constructor(private _projectsRepository: ProjectsRepository) {}

  getProjects(orgId: string, clientId?: string) {
    return this._projectsRepository.getProjects(orgId, clientId);
  }

  getProject(orgId: string, id: string) {
    return this._projectsRepository.getProject(orgId, id);
  }

  createProject(orgId: string, body: CreateProjectDto) {
    return this._projectsRepository.createProject(orgId, body);
  }

  // The repository returns null when the client belongs to another
  // organisation, or an updateMany count which is zero when the project does.
  // Both cases become a 404 at the controller.
  async updateProject(orgId: string, id: string, body: UpdateProjectDto) {
    const result = await this._projectsRepository.updateProject(
      orgId,
      id,
      body
    );

    if (!result || !result.count) {
      return null;
    }

    return this._projectsRepository.getProject(orgId, id);
  }

  deleteProject(orgId: string, id: string) {
    return this._projectsRepository.deleteProject(orgId, id);
  }
}
