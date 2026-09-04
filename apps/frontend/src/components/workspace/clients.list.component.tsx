'use client';

import React, { FC, useCallback } from 'react';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { deleteDialog } from '@gitroom/react/helpers/delete.dialog';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useClients } from '@gitroom/frontend/components/workspace/clients.hooks';
import { ClientModalComponent } from '@gitroom/frontend/components/workspace/client.modal.component';

export const ClientsListComponent: FC = () => {
  const { data, mutate, isLoading } = useClients();
  const modal = useModals();
  const toaster = useToaster();
  const fetch = useFetch();
  const t = useT();

  const openClient = useCallback(
    (client?: any) => () => {
      modal.openModal({
        title: client
          ? t('edit_client', 'Edit client')
          : t('add_client', 'Add client'),
        withCloseButton: true,
        children: <ClientModalComponent data={client} reload={mutate} />,
      });
    },
    [mutate, t]
  );

  const removeClient = useCallback(
    (client: any) => async () => {
      if (
        !(await deleteDialog(
          t(
            'delete_client_confirm',
            'Delete {{name}}? Their projects and tasks will be removed too.',
            { name: client.name }
          )
        ))
      ) {
        return;
      }

      await fetch(`/workspace/clients/${client.id}`, { method: 'DELETE' });
      toaster.show(t('client_deleted', 'Client deleted'), 'success');
      mutate();
    },
    [mutate, t]
  );

  // The (site) layout renders children into a bare `flex flex-1` with no
  // padding and no surface, and its header already shows the page title from
  // the menu. So the page provides its own surface, and never its own <h1>.
  return (
    <div className="bg-newBgColorInner p-[20px] flex flex-1 flex-col gap-[15px] transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[12px]">
        <div className="text-[13px] text-textItemBlur min-w-0">
          {t('clients_description', 'The agencies and businesses you work with.')}
        </div>
        <button
          type="button"
          onClick={openClient()}
          className="cursor-pointer px-[16px] h-[36px] bg-[#612BD3] hover:bg-[#5520CB] text-white transition-colors rounded-[8px] text-[13px] font-[600] flex items-center justify-center shrink-0"
        >
          {t('add_client', 'Add client')}
        </button>
      </div>

      {isLoading && (
        <div className="text-[14px] text-textItemBlur">
          {t('loading', 'Loading…')}
        </div>
      )}

      {!isLoading && !data?.length && (
        <div className="text-center py-[40px] text-[14px] text-textItemBlur">
          {t(
            'no_clients_yet',
            'No clients yet. Add your first one to get started.'
          )}
        </div>
      )}

      {!!data?.length && (
        <div className="flex flex-col gap-[8px]">
          {data.map((client: any) => (
            <div
              key={client.id}
              className="border border-newBorder rounded-[8px] p-[16px] flex flex-col sm:flex-row sm:items-center justify-between gap-[12px] hover:bg-boxHover transition-colors"
            >
              <div className="flex flex-col min-w-0">
                <div className="text-[15px] font-[600] truncate">
                  {client.name}
                </div>
                <div className="text-[13px] text-textItemBlur mt-[2px] truncate">
                  {client.contactEmail ||
                    t('no_contact_email', 'No contact email')}
                </div>
              </div>
              <div className="flex gap-[6px] shrink-0">
                <button
                  type="button"
                  onClick={openClient(client)}
                  className="cursor-pointer px-[16px] h-[36px] bg-btnSimple hover:bg-boxHover transition-colors rounded-[8px] text-[13px] font-[600]"
                >
                  {t('edit', 'Edit')}
                </button>
                <button
                  type="button"
                  onClick={removeClient(client)}
                  className="cursor-pointer px-[16px] h-[36px] bg-btnSimple hover:bg-boxHover transition-colors rounded-[8px] text-[13px] font-[600]"
                >
                  {t('delete', 'Delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
