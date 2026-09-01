import { Injectable } from '@nestjs/common';
import { TasksRepository } from '@gitroom/nestjs-libraries/database/prisma/workspace/tasks.repository';
import { CreateTaskDto } from '@gitroom/nestjs-libraries/dtos/workspace/create.task.dto';
import { UpdateTaskDto } from '@gitroom/nestjs-libraries/dtos/workspace/update.task.dto';
import { MoveTaskDto } from '@gitroom/nestjs-libraries/dtos/workspace/move.task.dto';

@Injectable()
export class TasksService {
  constructor(private _tasksRepository: TasksRepository) {}

  getTasks(orgId: string, projectId: string) {
    return this._tasksRepository.getTasks(orgId, projectId);
  }

  createTask(orgId: string, body: CreateTaskDto) {
    return this._tasksRepository.createTask(orgId, body);
  }

  // null from the repository means the project belongs to another
  // organisation; a zero count means the task does. Both become a 404.
  async updateTask(orgId: string, id: string, body: UpdateTaskDto) {
    const result = await this._tasksRepository.updateTask(orgId, id, body);

    if (!result || !result.count) {
      return null;
    }

    return this._tasksRepository.getTask(orgId, id);
  }

  async moveTask(orgId: string, id: string, body: MoveTaskDto) {
    const result = await this._tasksRepository.moveTask(orgId, id, body);
    return result ? { moved: true } : null;
  }

  deleteTask(orgId: string, id: string) {
    return this._tasksRepository.deleteTask(orgId, id);
  }
}
