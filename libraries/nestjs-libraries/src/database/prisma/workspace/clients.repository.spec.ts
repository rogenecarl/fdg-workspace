import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import {
  PrismaRepository,
  PrismaTransaction,
} from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { ClientsRepository } from '@gitroom/nestjs-libraries/database/prisma/workspace/clients.repository';

describe('ClientsRepository', () => {
  let prisma: DeepMockProxy<PrismaRepository<'client' | 'project' | 'task'>>;
  let transaction: DeepMockProxy<PrismaTransaction>;
  let repository: ClientsRepository;

  beforeEach(() => {
    prisma = mockDeep<PrismaRepository<'client' | 'project' | 'task'>>();
    transaction = mockDeep<PrismaTransaction>();
    repository = new ClientsRepository(prisma, transaction);
  });

  it('scopes the list to the organisation and hides deleted and archived rows', async () => {
    prisma.model.client.findMany.mockResolvedValue([] as any);

    await repository.getClients('org-1', false);

    expect(prisma.model.client.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        deletedAt: null,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('includes archived rows when asked', async () => {
    prisma.model.client.findMany.mockResolvedValue([] as any);

    await repository.getClients('org-1', true);

    expect(prisma.model.client.findMany).toHaveBeenCalledWith({
      where: { organizationId: 'org-1', deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('scopes a single read to the organisation', async () => {
    prisma.model.client.findFirst.mockResolvedValue(null);

    await repository.getClient('org-1', 'client-1');

    expect(prisma.model.client.findFirst).toHaveBeenCalledWith({
      where: { id: 'client-1', organizationId: 'org-1', deletedAt: null },
    });
  });

  it('stamps the organisation onto a created client', async () => {
    prisma.model.client.create.mockResolvedValue({ id: 'new-id' } as any);

    await repository.createClient('org-1', { name: 'Acme Ltd' });

    expect(prisma.model.client.create).toHaveBeenCalledWith({
      data: {
        organizationId: 'org-1',
        name: 'Acme Ltd',
        contactName: undefined,
        contactEmail: undefined,
        website: undefined,
        notes: undefined,
      },
    });
  });

  it('scopes updates to the organisation', async () => {
    prisma.model.client.updateMany.mockResolvedValue({ count: 1 } as any);

    await repository.updateClient('org-1', 'client-1', { name: 'Acme UK' });

    expect(prisma.model.client.updateMany).toHaveBeenCalledWith({
      where: { id: 'client-1', organizationId: 'org-1', deletedAt: null },
      data: {
        name: 'Acme UK',
        contactName: undefined,
        contactEmail: undefined,
        website: undefined,
        notes: undefined,
        status: undefined,
      },
    });
  });

  it('soft deletes the client together with its projects and tasks', async () => {
    transaction.model.$transaction.mockResolvedValue([] as any);

    await repository.deleteClient('org-1', 'client-1');

    expect(transaction.model.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.model.task.updateMany).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        deletedAt: null,
        project: { clientId: 'client-1' },
      },
      data: { deletedAt: expect.any(Date) },
    });
    expect(prisma.model.project.updateMany).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        clientId: 'client-1',
        deletedAt: null,
      },
      data: { deletedAt: expect.any(Date) },
    });
    expect(prisma.model.client.updateMany).toHaveBeenCalledWith({
      where: { id: 'client-1', organizationId: 'org-1', deletedAt: null },
      data: { deletedAt: expect.any(Date) },
    });
  });
});
