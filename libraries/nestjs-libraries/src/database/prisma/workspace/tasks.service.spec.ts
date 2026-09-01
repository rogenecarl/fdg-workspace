import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { TasksRepository } from '@gitroom/nestjs-libraries/database/prisma/workspace/tasks.repository';
import { TasksService } from '@gitroom/nestjs-libraries/database/prisma/workspace/tasks.service';

describe('TasksService', () => {
  let repository: DeepMockProxy<TasksRepository>;
  let service: TasksService;

  beforeEach(() => {
    repository = mockDeep<TasksRepository>();
    service = new TasksService(repository);
  });

  it('returns null when the project belongs to another organisation', async () => {
    repository.updateTask.mockResolvedValue(null as any);

    const result = await service.updateTask('org-1', 't1', {
      projectId: 'someone-elses-project',
      title: 'Draft',
    });

    expect(result).toBeNull();
    expect(repository.getTask).not.toHaveBeenCalled();
  });

  it('returns null when the task belongs to another organisation', async () => {
    repository.updateTask.mockResolvedValue({ count: 0 } as any);

    const result = await service.updateTask('org-1', 't1', {
      projectId: 'p1',
      title: 'Draft',
    });

    expect(result).toBeNull();
  });

  it('reports a failed move as null rather than success', async () => {
    repository.moveTask.mockResolvedValue(null as any);

    const result = await service.moveTask('org-1', 't1', {
      status: 'DONE',
      position: 0,
    });

    expect(result).toBeNull();
  });
});
