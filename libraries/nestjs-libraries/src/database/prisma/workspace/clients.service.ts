import { Injectable } from '@nestjs/common';
import { ClientsRepository } from '@gitroom/nestjs-libraries/database/prisma/workspace/clients.repository';
import { CreateClientDto } from '@gitroom/nestjs-libraries/dtos/workspace/create.client.dto';
import { UpdateClientDto } from '@gitroom/nestjs-libraries/dtos/workspace/update.client.dto';

@Injectable()
export class ClientsService {
  constructor(private _clientsRepository: ClientsRepository) {}

  getClients(orgId: string, includeArchived = false) {
    return this._clientsRepository.getClients(orgId, includeArchived);
  }

  getClient(orgId: string, id: string) {
    return this._clientsRepository.getClient(orgId, id);
  }

  createClient(orgId: string, body: CreateClientDto) {
    return this._clientsRepository.createClient(orgId, body);
  }

  // The repository returns an update count because it writes with updateMany.
  // A count of zero means the id belongs to another organisation (or is
  // already deleted), which the controller turns into a 404.
  async updateClient(orgId: string, id: string, body: UpdateClientDto) {
    const { count } = await this._clientsRepository.updateClient(
      orgId,
      id,
      body
    );

    if (!count) {
      return null;
    }

    return this._clientsRepository.getClient(orgId, id);
  }

  deleteClient(orgId: string, id: string) {
    return this._clientsRepository.deleteClient(orgId, id);
  }
}
