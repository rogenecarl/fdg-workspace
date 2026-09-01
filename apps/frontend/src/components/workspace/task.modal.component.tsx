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

const schema = object({
  title: string().required('Title is required').max(200),
  description: string().max(2000),
  status: string(),
  priority: string(),
  dueDate: string(),
});

const toDateInput = (value?: string) => (value ? value.slice(0, 10) : '');

export const TaskModalComponent: FC<{
  data?: any;
  projectId: string;
  defaultStatus?: string;
  reload: () => void;
}> = (props) => {
  const { data, projectId, defaultStatus, reload } = props;
  const fetch = useFetch();
  const modal = useModals();
  const toaster = useToaster();
  const t = useT();

  const form = useForm({
    resolver: yupResolver(schema),
    values: {
      title: data?.title || '',
      description: data?.description || '',
      status: data?.status || defaultStatus || 'TODO',
      priority: data?.priority || 'MEDIUM',
      dueDate: toDateInput(data?.dueDate),
    },
  });

  const submit = useCallback(
    async (values: any) => {
      const body: any = {
        projectId,
        title: values.title,
        status: values.status,
        priority: values.priority,
      };

      if (values.description) body.description = values.description;
      if (values.dueDate) body.dueDate = new Date(values.dueDate).toISOString();

      const response = await fetch(
        data ? `/workspace/tasks/${data.id}` : '/workspace/tasks',
        { method: data ? 'PUT' : 'POST', body: JSON.stringify(body) }
      );

      if (!response.ok) {
        toaster.show(
          t('task_save_failed', 'Could not save the task'),
          'warning'
        );
        return;
      }

      toaster.show(
        data ? t('task_updated', 'Task updated') : t('task_created', 'Task created'),
        'success'
      );
      reload();
      modal.closeAll();
    },
    [data, projectId, reload, t]
  );

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        className="flex flex-col gap-[16px] w-full"
      >
        <Input
          label={t('title', 'Title')}
          name="title"
          placeholder="Draft homepage copy"
        />
        <Textarea label={t('description', 'Description')} name="description" />

        <div className="flex flex-col sm:flex-row gap-[16px]">
          <div className="flex-1">
            <Select label={t('status', 'Status')} name="status">
              <option value="TODO">{t('to_do', 'To do')}</option>
              <option value="IN_PROGRESS">
                {t('in_progress', 'In progress')}
              </option>
              <option value="REVIEW">{t('review', 'Review')}</option>
              <option value="DONE">{t('done', 'Done')}</option>
            </Select>
          </div>
          <div className="flex-1">
            <Select label={t('priority', 'Priority')} name="priority">
              <option value="LOW">{t('low', 'Low')}</option>
              <option value="MEDIUM">{t('medium', 'Medium')}</option>
              <option value="HIGH">{t('high', 'High')}</option>
            </Select>
          </div>
        </div>

        <Input label={t('due_date', 'Due date')} name="dueDate" type="date" />

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
              : t('create_task', 'Create task')}
          </button>
        </div>
      </form>
    </FormProvider>
  );
};
