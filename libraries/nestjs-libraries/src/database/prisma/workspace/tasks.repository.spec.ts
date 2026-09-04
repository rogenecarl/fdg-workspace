import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import {
  PrismaRepository,
  PrismaTransaction,
} from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { TasksRepository } from '@gitroom/nestjs-libraries/database/prisma/workspace/tasks.repository';

describe('TasksRepository', () => {
  let prisma: DeepMockProxy<PrismaRepository<'task' | 'project'>>;
  let transaction: DeepMockProxy<PrismaTransaction>;
  let repository: TasksRepository;

  beforeEach(() => {
    prisma = mockDeep<PrismaRepository<'task' | 'project'>>();
    transaction = mockDeep<PrismaTransaction>();
    repository = new TasksRepository(prisma, transaction);
  });

  it('lists a project’s tasks ordered by column then position', async () => {
    prisma.model.task.findMany.mockResolvedValue([] as any);

    await repository.getTasks('org-1', 'p1');

    expect(prisma.model.task.findMany).toHaveBeenCalledWith({
      where: { organizationId: 'org-1', projectId: 'p1', deletedAt: null },
      orderBy: [{ status: 'asc' }, { position: 'asc' }],
    });
  });

  it('refuses to create a task against another organisation’s project', async () => {
    prisma.model.project.findFirst.mockResolvedValue(null);

    const result = await repository.createTask('org-1', {
      projectId: 'project-from-another-org',
      title: 'Draft copy',
    });

    expect(result).toBeNull();
    expect(prisma.model.task.create).not.toHaveBeenCalled();
  });

  it('appends a new task to the end of its column', async () => {
    prisma.model.project.findFirst.mockResolvedValue({ id: 'p1' } as any);
    prisma.model.task.count.mockResolvedValue(3 as any);
    prisma.model.task.create.mockResolvedValue({ id: 't1' } as any);

    await repository.createTask('org-1', {
      projectId: 'p1',
      title: 'Draft copy',
    });

    const data = prisma.model.task.create.mock.calls[0][0].data as any;
    expect(data.position).toBe(3);
    expect(data.organizationId).toBe('org-1');
  });

  it('scopes deletes to the organisation and soft deletes', async () => {
    prisma.model.task.updateMany.mockResolvedValue({ count: 1 } as any);

    await repository.deleteTask('org-1', 't1');

    expect(prisma.model.task.updateMany).toHaveBeenCalledWith({
      where: { id: 't1', organizationId: 'org-1', deletedAt: null },
      data: { deletedAt: expect.any(Date) },
    });
  });

  describe('moveTask', () => {
    it('returns null when the task belongs to another organisation', async () => {
      prisma.model.task.findFirst.mockResolvedValue(null);

      const result = await repository.moveTask('org-1', 't1', {
        status: 'DONE',
        position: 0,
      });

      expect(result).toBeNull();
      expect(transaction.model.$transaction).not.toHaveBeenCalled();
    });

    it('renumbers the destination column contiguously from zero', async () => {
      prisma.model.task.findFirst.mockResolvedValue({
        id: 't2',
        projectId: 'p1',
        status: 'TODO',
      } as any);
      // Destination column already holds a, b, c (t2 is moving in from TODO),
      // and t2 was the only task in the source column.
      prisma.model.task.findMany
        .mockResolvedValueOnce([{ id: 'a' }, { id: 'b' }, { id: 'c' }] as any)
        .mockResolvedValueOnce([] as any);
      transaction.model.$transaction.mockResolvedValue([] as any);

      await repository.moveTask('org-1', 't2', {
        status: 'IN_PROGRESS',
        position: 1,
      });

      // t2 inserted at index 1 -> a(0), t2(1), b(2), c(3)
      const positions = prisma.model.task.update.mock.calls.map((c: any) => [
        c[0].where.id,
        c[0].data.position,
      ]);

      expect(positions).toEqual([
        ['a', 0],
        ['t2', 1],
        ['b', 2],
        ['c', 3],
      ]);
    });

    it('clamps a position beyond the column length to the end', async () => {
      prisma.model.task.findFirst.mockResolvedValue({
        id: 't2',
        projectId: 'p1',
        status: 'TODO',
      } as any);
      prisma.model.task.findMany
        .mockResolvedValueOnce([{ id: 'a' }] as any)
        .mockResolvedValueOnce([] as any);
      transaction.model.$transaction.mockResolvedValue([] as any);

      await repository.moveTask('org-1', 't2', {
        status: 'DONE',
        position: 99,
      });

      const positions = prisma.model.task.update.mock.calls.map((c: any) => [
        c[0].where.id,
        c[0].data.position,
      ]);

      expect(positions).toEqual([
        ['a', 0],
        ['t2', 1],
      ]);
    });

    it('renumbers the source column too when the task changes column', async () => {
      prisma.model.task.findFirst.mockResolvedValue({
        id: 't2',
        projectId: 'p1',
        status: 'TODO',
      } as any);
      prisma.model.task.findMany
        .mockResolvedValueOnce([{ id: 'a' }] as any) // destination
        .mockResolvedValueOnce([{ id: 'x' }, { id: 'y' }] as any); // source
      transaction.model.$transaction.mockResolvedValue([] as any);

      await repository.moveTask('org-1', 't2', {
        status: 'DONE',
        position: 0,
      });

      const ids = prisma.model.task.update.mock.calls.map(
        (c: any) => c[0].where.id
      );

      expect(ids).toEqual(['t2', 'a', 'x', 'y']);
    });

    it('does not renumber a source column when the task stays put', async () => {
      prisma.model.task.findFirst.mockResolvedValue({
        id: 't2',
        projectId: 'p1',
        status: 'TODO',
      } as any);
      prisma.model.task.findMany.mockResolvedValue([{ id: 'a' }] as any);
      transaction.model.$transaction.mockResolvedValue([] as any);

      await repository.moveTask('org-1', 't2', {
        status: 'TODO',
        position: 0,
      });

      expect(prisma.model.task.findMany).toHaveBeenCalledTimes(1);
    });
  });
});
