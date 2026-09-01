import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { ProjectsRepository } from '@gitroom/nestjs-libraries/database/prisma/workspace/projects.repository';
import { ProjectsService } from '@gitroom/nestjs-libraries/database/prisma/workspace/projects.service';

describe('ProjectsService', () => {
  let repository: DeepMockProxy<ProjectsRepository>;
  let service: ProjectsService;

  beforeEach(() => {
    repository = mockDeep<ProjectsRepository>();
    service = new ProjectsService(repository);
  });

  it('passes the client filter through', async () => {
    repository.getProjects.mockResolvedValue([] as any);

    await service.getProjects('org-1', 'client-1');

    expect(repository.getProjects).toHaveBeenCalledWith('org-1', 'client-1');
  });

  it('returns the updated project rather than an update count', async () => {
    repository.updateProject.mockResolvedValue({ count: 1 } as any);
    repository.getProject.mockResolvedValue({ id: 'p1', name: 'Site' } as any);

    const result = await service.updateProject('org-1', 'p1', {
      clientId: 'c1',
      name: 'Site',
    });

    expect(result).toEqual({ id: 'p1', name: 'Site' });
  });

  it('returns null when the client is not owned by the organisation', async () => {
    repository.updateProject.mockResolvedValue(null as any);

    const result = await service.updateProject('org-1', 'p1', {
      clientId: 'someone-elses-client',
      name: 'Site',
    });

    expect(result).toBeNull();
    expect(repository.getProject).not.toHaveBeenCalled();
  });

  it('returns null when the project belongs to another organisation', async () => {
    repository.updateProject.mockResolvedValue({ count: 0 } as any);

    const result = await service.updateProject('org-1', 'p1', {
      clientId: 'c1',
      name: 'Site',
    });

    expect(result).toBeNull();
    expect(repository.getProject).not.toHaveBeenCalled();
  });
});
