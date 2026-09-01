'use client';

import React, { FC, useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { object, string } from 'yup';
import { Input } from '@gitroom/react/form/input';
import { Textarea } from '@gitroom/react/form/textarea';
import { Select } from '@gitroom/react/form/select';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useClients } from '@gitroom/frontend/components/workspace/clients.hooks';

const schema = object({
  clientId: string().required('Client is required'),
  name: string().required('Name is required').max(120),
  description: string().max(2000),
  status: string(),
  startDate: string(),
  dueDate: string(),
});

// An ISO timestamp from the API needs trimming to yyyy-mm-dd for <input type="date">.
const toDateInput = (value?: string) => (value ? value.slice(0, 10) : '');

export const ProjectModalComponent: FC<{
  data?: any;
  defaultClientId?: string;
  reload: () => void;
}> = (props) => {
  const { data, defaultClientId, reload } = props;
  const fetch = useFetch();
  const modal = useModals();
  const toaster = useToaster();
  const t = useT();
  const { data: clients } = useClients();

  const form = useForm({
    resolver: yupResolver(schema),
    values: {
      clientId: data?.clientId || defaultClientId || '',
      name: data?.name || '',
      description: data?.description || '',
      status: data?.status || 'PLANNING',
      startDate: toDateInput(data?.startDate),
      dueDate: toDateInput(data?.dueDate),
    },
  });

  const submit = useCallback(
    async (values: any) => {
      const body: any = {
        clientId: values.clientId,
        name: values.name,
        status: values.status,
      };

      if (values.description) body.description = values.description;
      // The DTO validates these as ISO date strings, so send a full timestamp
      // rather than the bare yyyy-mm-dd the date input produces.
      if (values.startDate)
        body.startDate = new Date(values.startDate).toISOString();
      if (values.dueDate) body.dueDate = new Date(values.dueDate).toISOString();

      const response = await fetch(
        data ? `/workspace/projects/${data.id}` : '/workspace/projects',
        { method: data ? 'PUT' : 'POST', body: JSON.stringify(body) }
      );

      if (!response.ok) {
        toaster.show(
          t('project_save_failed', 'Could not save the project'),
          'warning'
        );
        return;
      }

      toaster.show(
        data
          ? t('project_updated', 'Project updated')
          : t('project_created', 'Project created'),
        'success'
      );
      reload();
      modal.closeAll();
    },
    [data, reload, t]
  );

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        className="flex flex-col gap-[16px] w-full"
      >
        <Select label={t('client', 'Client')} name="clientId">
          <option value="">{t('select_a_client', 'Select a client')}</option>
          {(clients || []).map((client: any) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </Select>

        <Input
          label={t('name', 'Name')}
          name="name"
          placeholder="Website redesign"
        />
        <Textarea label={t('description', 'Description')} name="description" />

        <Select label={t('status', 'Status')} name="status">
          <option value="PLANNING">{t('planning', 'Planning')}</option>
          <option value="ACTIVE">{t('active', 'Active')}</option>
          <option value="ON_HOLD">{t('on_hold', 'On hold')}</option>
          <option value="COMPLETED">{t('completed', 'Completed')}</option>
        </Select>

        <div className="flex flex-col sm:flex-row gap-[16px]">
          <div className="flex-1">
            <Input
              label={t('start_date', 'Start date')}
              name="startDate"
              type="date"
            />
          </div>
          <div className="flex-1">
            <Input
              label={t('due_date', 'Due date')}
              name="dueDate"
              type="date"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-[8px] sm:justify-end">
          <button
            type="button"
            onClick={() => modal.closeAll()}
            className="cursor-pointer px-[20px] h-[44px] bg-btnSimple hover:bg-boxHover transition-colors rounded-[8px] text-[15px] font-[600]"
          >
            {t('cancel', 'Cancel')}
          </button>
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="cursor-pointer px-[20px] h-[44px] bg-[#612BD3] hover:bg-[#5520CB] disabled:opacity-50 transition-colors text-white rounded-[8px] text-[15px] font-[600]"
          >
            {data
              ? t('save_changes', 'Save changes')
              : t('create_project', 'Create project')}
          </button>
        </div>
      </form>
    </FormProvider>
  );
};
