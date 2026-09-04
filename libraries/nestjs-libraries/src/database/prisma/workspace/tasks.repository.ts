import { Injectable } from '@nestjs/common';
import {
  PrismaRepository,
  PrismaTransaction,
} from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { CreateTaskDto } from '@gitroom/nestjs-libraries/dtos/workspace/create.task.dto';
import { UpdateTaskDto } from '@gitroom/nestjs-libraries/dtos/workspace/update.task.dto';
import { MoveTaskDto } from '@gitroom/nestjs-libraries/dtos/workspace/move.task.dto';

@Injectable()
export class TasksRepository {
  constructor(
    private _workspace: PrismaRepository<'task' | 'project'>,
    private _transaction: PrismaTransaction
  ) {}

  getTasks(orgId: string, projectId: string) {
    return this._workspace.model.task.findMany({
      where: { organizationId: orgId, projectId, deletedAt: null },
      orderBy: [{ status: 'asc' }, { position: 'asc' }],
    });
  }

  // projectId arrives from the request body, so it must be checked against the
  // caller's organisation before anything is written against it.
  private ownsProject(orgId: string, projectId: string) {
    return this._workspace.model.project.findFirst({
      where: { id: projectId, organizationId: orgId, deletedAt: null },
    });
  }

  private toData(body: CreateTaskDto) {
    return {
      projectId: body.projectId,
      title: body.title,
      description: body.description,
      status: body.status,
      priority: body.priority,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      assigneeId: body.assigneeId,
      visibleToClient: body.visibleToClient,
    };
  }

  async createTask(orgId: string, body: CreateTaskDto) {
    if (!(await this.ownsProject(orgId, body.projectId))) {
      return null;
    }

    // New tasks land at the bottom of their column.
    const position = await this._workspace.model.task.count({
      where: {
        organizationId: orgId,
        projectId: body.projectId,
        status: body.status || 'TODO',
        deletedAt: null,
      },
    });

    return this._workspace.model.task.create({
      data: { organizationId: orgId, position, ...this.toData(body) },
    });
  }

  async updateTask(orgId: string, id: string, body: UpdateTaskDto) {
    if (!(await this.ownsProject(orgId, body.projectId))) {
      return null;
    }

    return this._workspace.model.task.updateMany({
      where: { id, organizationId: orgId, deletedAt: null },
      data: this.toData(body),
    });
  }

  deleteTask(orgId: string, id: string) {
    return this._workspace.model.task.updateMany({
      where: { id, organizationId: orgId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  getTask(orgId: string, id: string) {
    return this._workspace.model.task.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
  }

  /**
   * Moves a task to a column and index, then rewrites `position` as 0..n for
   * every affected column in one transaction.
   *
   * Rewriting whole columns is O(n), but n is tens of tasks, not thousands. It
   * is simpler than fractional indexing and self-heals any drift that earlier
   * bugs or partial writes may have left behind.
   */
  async moveTask(orgId: string, id: string, body: MoveTaskDto) {
    const task = await this._workspace.model.task.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });

    if (!task) {
      return null;
    }

    const destination = await this._workspace.model.task.findMany({
      where: {
        organizationId: orgId,
        projectId: task.projectId,
        status: body.status,
        deletedAt: null,
        id: { not: id },
      },
      orderBy: { position: 'asc' },
      select: { id: true },
    });

    const ids = destination.map((t) => t.id);
    // Clamp rather than error: a stale board can send an index past the end.
    const index = Math.min(Math.max(body.position, 0), ids.length);
    ids.splice(index, 0, id);

    const writes = ids.map((taskId, position) =>
      this._workspace.model.task.update({
        where: { id: taskId },
        data: {
          position,
          ...(taskId === id ? { status: body.status } : {}),
        },
      })
    );

    // Leaving its old column puts a gap in that column's numbering, so it
    // needs renumbering too. Staying put means the list above already covers it.
    if (task.status !== body.status) {
      const source = await this._workspace.model.task.findMany({
        where: {
          organizationId: orgId,
          projectId: task.projectId,
          status: task.status,
          deletedAt: null,
          id: { not: id },
        },
        orderBy: { position: 'asc' },
        select: { id: true },
      });

      source.forEach((t, position) => {
        writes.push(
          this._workspace.model.task.update({
            where: { id: t.id },
            data: { position },
          })
        );
      });
    }

    return this._transaction.model.$transaction(writes);
  }
}
