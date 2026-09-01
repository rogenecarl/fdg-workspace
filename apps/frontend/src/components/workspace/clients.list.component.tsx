'use client';

import React, { FC, useCallback } from 'react';
import { Button } from '@gitroom/react/form/button';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { deleteDialog } from '@gitroom/react/helpers/delete.dialog';
import { useClients } from '@gitroom/frontend/components/workspace/clients.hooks';
import { ClientModalComponent } from '@gitroom/frontend/components/workspace/client.modal.component';

export const ClientsListComponent: FC = () => {
  const { data, mutate, isLoading } = useClients();
  const modal = useModals();
  const toaster = useToaster();
  const fetch = useFetch();

  const openClient = useCallback(
    (client?: any) => () => {
      modal.openModal({
        title: client ? 'Edit client' : 'Add client',
        withCloseButton: true,
        children: <ClientModalComponent data={client} reload={mutate} />,
      });
    },
    [mutate]
  );

  const removeClient = useCallback(
    (client: any) => async () => {
      if (
        !(await deleteDialog(
          `Delete ${client.name}? Their projects and tasks will be removed too.`
        ))
      ) {
        return;
      }

      await fetch(`/workspace/clients/${client.id}`, { method: 'DELETE' });
      toaster.show('Client deleted', 'success');
      mutate();
    },
    [mutate]
  );

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-[24px]">Clients</h1>
        <Button onClick={openClient()}>Add client</Button>
      </div>

      <div className="my-[16px] bg-sixth border-fifth border rounded-[4px] p-[24px]">
        {isLoading && <div className="text-customColor18">Loading…</div>}

        {!isLoading && !data?.length && (
          <div className="text-center py-[32px] text-customColor18">
            No clients yet. Add your first one to get started.
          </div>
        )}

        {!!data?.length && (
          <div className="flex flex-col gap-[12px]">
            {data.map((client: any) => (
              <div
                key={client.id}
                className="flex items-center justify-between border-fifth border rounded-[4px] p-[16px] gap-[16px]"
              >
                <div className="flex flex-col min-w-0">
                  <div className="font-bold truncate">{client.name}</div>
                  <div className="text-customColor18 truncate">
                    {client.contactEmail || 'No contact email'}
                  </div>
                </div>
                <div className="flex gap-[8px] shrink-0">
                  <Button onClick={openClient(client)}>Edit</Button>
                  <Button onClick={removeClient(client)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
