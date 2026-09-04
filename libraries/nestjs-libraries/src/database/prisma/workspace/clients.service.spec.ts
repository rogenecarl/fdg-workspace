import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { ClientsRepository } from '@gitroom/nestjs-libraries/database/prisma/workspace/clients.repository';
import { ClientsService } from '@gitroom/nestjs-libraries/database/prisma/workspace/clients.service';

describe('ClientsService', () => {
  let repository: DeepMockProxy<ClientsRepository>;
  let service: ClientsService;

  beforeEach(() => {
    repository = mockDeep<ClientsRepository>();
    service = new ClientsService(repository);
  });

  it('defaults to hiding archived clients', async () => {
    repository.getClients.mockResolvedValue([] as any);

    await service.getClients('org-1');

    expect(repository.getClients).toHaveBeenCalledWith('org-1', false);
  });

  it('returns the updated client rather than an update count', async () => {
    repository.updateClient.mockResolvedValue({ count: 1 } as any);
    repository.getClient.mockResolvedValue({ id: 'c1', name: 'Acme' } as any);

    const result = await service.updateClient('org-1', 'c1', { name: 'Acme' });

    expect(result).toEqual({ id: 'c1', name: 'Acme' });
  });

  it('returns null when updating a client in another organisation', async () => {
    repository.updateClient.mockResolvedValue({ count: 0 } as any);

    const result = await service.updateClient('org-1', 'c1', { name: 'Acme' });

    expect(result).toBeNull();
    expect(repository.getClient).not.toHaveBeenCalled();
  });
});
