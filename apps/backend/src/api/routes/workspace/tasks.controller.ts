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
import { TasksService } from '@gitroom/nestjs-libraries/database/prisma/workspace/tasks.service';
import { CreateTaskDto } from '@gitroom/nestjs-libraries/dtos/workspace/create.task.dto';
import { UpdateTaskDto } from '@gitroom/nestjs-libraries/dtos/workspace/update.task.dto';
import { MoveTaskDto } from '@gitroom/nestjs-libraries/dtos/workspace/move.task.dto';

@ApiTags('Workspace Tasks')
@Controller('/workspace/tasks')
export class TasksController {
  constructor(private _tasksService: TasksService) {}

  @Get('/')
  async getTasks(
    @GetOrgFromRequest() org: Organization,
    @Query('projectId') projectId: string
  ) {
    if (!projectId) {
      throw new HttpException({ msg: 'projectId is required' }, 400);
    }

    return this._tasksService.getTasks(org.id, projectId);
  }

  @Post('/')
  async createTask(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CreateTaskDto
  ) {
    const task = await this._tasksService.createTask(org.id, body);

    if (!task) {
      throw new HttpException({ msg: 'Project not found' }, 404);
    }

    return task;
  }

  @Put('/:id')
  async updateTask(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: UpdateTaskDto
  ) {
    const task = await this._tasksService.updateTask(org.id, id, body);

    if (!task) {
      throw new HttpException({ msg: 'Task not found' }, 404);
    }

    return task;
  }

  @Put('/:id/move')
  async moveTask(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: MoveTaskDto
  ) {
    const moved = await this._tasksService.moveTask(org.id, id, body);

    if (!moved) {
      throw new HttpException({ msg: 'Task not found' }, 404);
    }

    return moved;
  }

  @Delete('/:id')
  async deleteTask(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    await this._tasksService.deleteTask(org.id, id);
    return { deleted: true };
  }
}
