import { Injectable } from '@nestjs/common';
import {
  PrismaRepository,
  PrismaTransaction,
} from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { CreateProjectDto } from '@gitroom/nestjs-libraries/dtos/workspace/create.project.dto';
import { UpdateProjectDto } from '@gitroom/nestjs-libraries/dtos/workspace/update.project.dto';

const clientSummary = { client: { select: { id: true, name: true } } };

@Injectable()
export class ProjectsRepository {
  constructor(
    private _workspace: PrismaRepository<'project' | 'task' | 'client'>,
    private _transaction: PrismaTransaction
  ) {}

  getProjects(orgId: string, clientId?: string) {
    return this._workspace.model.project.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
        ...(clientId ? { clientId } : {}),
      },
      include: clientSummary,
      orderBy: { createdAt: 'desc' },
    });
  }

  getProject(orgId: string, id: string) {
    return this._workspace.model.project.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      include: clientSummary,
    });
  }

  // A project's clientId arrives from the request body, so it must be checked
  // against the caller's organisation. Without this a caller could attach a
  // project to another organisation's client.
  private ownsClient(orgId: string, clientId: string) {
    return this._workspace.model.client.findFirst({
      where: { id: clientId, organizationId: orgId, deletedAt: null },
    });
  }

  private toData(body: CreateProjectDto) {
    return {
      clientId: body.clientId,
      name: body.name,
      description: body.description,
      status: body.status,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    };
  }

  async createProject(orgId: string, body: CreateProjectDto) {
    if (!(await this.ownsClient(orgId, body.clientId))) {
      return null;
    }

    return this._workspace.model.project.create({
      data: { organizationId: orgId, ...this.toData(body) },
    });
  }

  async updateProject(orgId: string, id: string, body: UpdateProjectDto) {
    if (!(await this.ownsClient(orgId, body.clientId))) {
      return null;
    }

    return this._workspace.model.project.updateMany({
      where: { id, organizationId: orgId, deletedAt: null },
      data: this.toData(body),
    });
  }

  deleteProject(orgId: string, id: string) {
    const deletedAt = new Date();

    return this._transaction.model.$transaction([
      this._workspace.model.task.updateMany({
        where: { organizationId: orgId, projectId: id, deletedAt: null },
        data: { deletedAt },
      }),
      this._workspace.model.project.updateMany({
        where: { id, organizationId: orgId, deletedAt: null },
        data: { deletedAt },
      }),
    ]);
  }
}
