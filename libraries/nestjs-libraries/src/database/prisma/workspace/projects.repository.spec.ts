import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import {
  PrismaRepository,
  PrismaTransaction,
} from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { ProjectsRepository } from '@gitroom/nestjs-libraries/database/prisma/workspace/projects.repository';

describe('ProjectsRepository', () => {
  let prisma: DeepMockProxy<PrismaRepository<'project' | 'task' | 'client'>>;
  let transaction: DeepMockProxy<PrismaTransaction>;
  let repository: ProjectsRepository;

  beforeEach(() => {
    prisma = mockDeep<PrismaRepository<'project' | 'task' | 'client'>>();
    transaction = mockDeep<PrismaTransaction>();
    repository = new ProjectsRepository(prisma, transaction);
  });

  it('scopes the list to the organisation and excludes deleted rows', async () => {
    prisma.model.project.findMany.mockResolvedValue([] as any);

    await repository.getProjects('org-1');

    expect(prisma.model.project.findMany).toHaveBeenCalledWith({
      where: { organizationId: 'org-1', deletedAt: null },
      include: { client: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('filters by client when one is given', async () => {
    prisma.model.project.findMany.mockResolvedValue([] as any);

    await repository.getProjects('org-1', 'client-1');

    expect(prisma.model.project.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        deletedAt: null,
        clientId: 'client-1',
      },
      include: { client: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('scopes a single read to the organisation', async () => {
    prisma.model.project.findFirst.mockResolvedValue(null);

    await repository.getProject('org-1', 'p1');

    expect(prisma.model.project.findFirst).toHaveBeenCalledWith({
      where: { id: 'p1', organizationId: 'org-1', deletedAt: null },
      include: { client: { select: { id: true, name: true } } },
    });
  });

  it('refuses to create a project against another organisation’s client', async () => {
    prisma.model.client.findFirst.mockResolvedValue(null);

    const result = await repository.createProject('org-1', {
      clientId: 'client-from-another-org',
      name: 'Website redesign',
    });

    expect(result).toBeNull();
    expect(prisma.model.project.create).not.toHaveBeenCalled();
  });

  it('creates the project when the client belongs to the organisation', async () => {
    prisma.model.client.findFirst.mockResolvedValue({ id: 'client-1' } as any);
    prisma.model.project.create.mockResolvedValue({ id: 'p1' } as any);

    await repository.createProject('org-1', {
      clientId: 'client-1',
      name: 'Website redesign',
    });

    expect(prisma.model.project.create).toHaveBeenCalledWith({
      data: {
        organizationId: 'org-1',
        clientId: 'client-1',
        name: 'Website redesign',
        description: undefined,
        status: undefined,
        startDate: undefined,
        dueDate: undefined,
      },
    });
  });

  it('converts date strings to Date objects on create', async () => {
    prisma.model.client.findFirst.mockResolvedValue({ id: 'client-1' } as any);
    prisma.model.project.create.mockResolvedValue({ id: 'p1' } as any);

    await repository.createProject('org-1', {
      clientId: 'client-1',
      name: 'Q3 campaign',
      startDate: '2026-09-01T00:00:00.000Z',
      dueDate: '2026-12-01T00:00:00.000Z',
    });

    const data = prisma.model.project.create.mock.calls[0][0].data as any;
    expect(data.startDate).toBeInstanceOf(Date);
    expect(data.dueDate).toBeInstanceOf(Date);
  });

  it('scopes updates to the organisation', async () => {
    prisma.model.client.findFirst.mockResolvedValue({ id: 'client-1' } as any);
    prisma.model.project.updateMany.mockResolvedValue({ count: 1 } as any);

    await repository.updateProject('org-1', 'p1', {
      clientId: 'client-1',
      name: 'Renamed',
    });

    expect(prisma.model.project.updateMany).toHaveBeenCalledWith({
      where: { id: 'p1', organizationId: 'org-1', deletedAt: null },
      data: {
        clientId: 'client-1',
        name: 'Renamed',
        description: undefined,
        status: undefined,
        startDate: undefined,
        dueDate: undefined,
      },
    });
  });

  it('soft deletes the project together with its tasks', async () => {
    transaction.model.$transaction.mockResolvedValue([] as any);

    await repository.deleteProject('org-1', 'p1');

    expect(transaction.model.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.model.task.updateMany).toHaveBeenCalledWith({
      where: { organizationId: 'org-1', projectId: 'p1', deletedAt: null },
      data: { deletedAt: expect.any(Date) },
    });
    expect(prisma.model.project.updateMany).toHaveBeenCalledWith({
      where: { id: 'p1', organizationId: 'org-1', deletedAt: null },
      data: { deletedAt: expect.any(Date) },
    });
  });
});
