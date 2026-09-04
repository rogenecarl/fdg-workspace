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
import { ClientsService } from '@gitroom/nestjs-libraries/database/prisma/workspace/clients.service';
import { CreateClientDto } from '@gitroom/nestjs-libraries/dtos/workspace/create.client.dto';
import { UpdateClientDto } from '@gitroom/nestjs-libraries/dtos/workspace/update.client.dto';

@ApiTags('Workspace Clients')
@Controller('/workspace/clients')
export class ClientsController {
  constructor(private _clientsService: ClientsService) {}

  @Get('/')
  async getClients(
    @GetOrgFromRequest() org: Organization,
    @Query('includeArchived') includeArchived?: string
  ) {
    return this._clientsService.getClients(org.id, includeArchived === 'true');
  }

  @Get('/:id')
  async getClient(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    const client = await this._clientsService.getClient(org.id, id);

    if (!client) {
      throw new HttpException({ msg: 'Client not found' }, 404);
    }

    return client;
  }

  @Post('/')
  async createClient(
    @GetOrgFromRequest() org: Organization,
    @Body() body: CreateClientDto
  ) {
    return this._clientsService.createClient(org.id, body);
  }

  @Put('/:id')
  async updateClient(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: UpdateClientDto
  ) {
    const client = await this._clientsService.updateClient(org.id, id, body);

    if (!client) {
      throw new HttpException({ msg: 'Client not found' }, 404);
    }

    return client;
  }

  @Delete('/:id')
  async deleteClient(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    await this._clientsService.deleteClient(org.id, id);
    return { deleted: true };
  }
}
