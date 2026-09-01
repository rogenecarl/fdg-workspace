import { Injectable } from '@nestjs/common';
import {
  PrismaRepository,
  PrismaTransaction,
} from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { CreateClientDto } from '@gitroom/nestjs-libraries/dtos/workspace/create.client.dto';
import { UpdateClientDto } from '@gitroom/nestjs-libraries/dtos/workspace/update.client.dto';

@Injectable()
export class ClientsRepository {
  constructor(
    private _workspace: PrismaRepository<'client' | 'project' | 'task'>,
    private _transaction: PrismaTransaction
  ) {}

  getClients(orgId: string, includeArchived: boolean) {
    return this._workspace.model.client.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
        ...(includeArchived ? {} : { status: 'ACTIVE' }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getClient(orgId: string, id: string) {
    return this._workspace.model.client.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
  }

  createClient(orgId: string, body: CreateClientDto) {
    return this._workspace.model.client.create({
      data: {
        organizationId: orgId,
        name: body.name,
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        website: body.website,
        notes: body.notes,
      },
    });
  }

  // `updateMany` rather than `update`: it accepts a compound `where` including
  // organizationId. `update` requires a unique selector, which would let a
  // caller reach a row belonging to another organisation.
  updateClient(orgId: string, id: string, body: UpdateClientDto) {
    return this._workspace.model.client.updateMany({
      where: { id, organizationId: orgId, deletedAt: null },
      data: {
        name: body.name,
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        website: body.website,
        notes: body.notes,
        status: body.status,
      },
    });
  }

  // Deleting a client takes its projects and tasks with it, in one transaction
  // so a partial cascade can never leave orphaned work visible.
  deleteClient(orgId: string, id: string) {
    const deletedAt = new Date();

    return this._transaction.model.$transaction([
      this._workspace.model.task.updateMany({
        where: {
          organizationId: orgId,
          deletedAt: null,
          project: { clientId: id },
        },
        data: { deletedAt },
      }),
      this._workspace.model.project.updateMany({
        where: { organizationId: orgId, clientId: id, deletedAt: null },
        data: { deletedAt },
      }),
      this._workspace.model.client.updateMany({
        where: { id, organizationId: orgId, deletedAt: null },
        data: { deletedAt },
      }),
    ]);
  }
}
