'use client';

import React, { FC, useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { object, string } from 'yup';
import { Input } from '@gitroom/react/form/input';
import { Textarea } from '@gitroom/react/form/textarea';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

const schema = object({
  name: string().required('Name is required').max(120),
  contactName: string().max(120),
  contactEmail: string().email('Must be a valid email'),
  website: string().url('Must be a valid URL'),
  notes: string().max(2000),
});

export const ClientModalComponent: FC<{
  data?: any;
  reload: () => void;
}> = (props) => {
  const { data, reload } = props;
  const fetch = useFetch();
  const modal = useModals();
  const toaster = useToaster();
  const t = useT();

  const form = useForm({
    resolver: yupResolver(schema),
    values: {
      name: data?.name || '',
      contactName: data?.contactName || '',
      contactEmail: data?.contactEmail || '',
      website: data?.website || '',
      notes: data?.notes || '',
    },
  });

  const submit = useCallback(
    async (values: any) => {
      // The DTO validates contactEmail as an email and website as a URL, so an
      // empty string would fail validation. Drop empties instead of sending "".
      const body = Object.fromEntries(
        Object.entries(values).filter(([, value]) => value !== '')
      );

      const response = await fetch(
        data ? `/workspace/clients/${data.id}` : '/workspace/clients',
        {
          method: data ? 'PUT' : 'POST',
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        toaster.show(
          t('client_save_failed', 'Could not save the client'),
          'warning'
        );
        return;
      }

      toaster.show(
        data
          ? t('client_updated', 'Client updated')
          : t('client_created', 'Client created'),
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
        <Input label={t('name', 'Name')} name="name" placeholder="Acme Ltd" />
        <Input
          label={t('contact_name', 'Contact name')}
          name="contactName"
          placeholder="Jane Doe"
        />
        <Input
          label={t('contact_email', 'Contact email')}
          name="contactEmail"
          placeholder="jane@acme.com"
        />
        <Input
          label={t('website', 'Website')}
          name="website"
          placeholder="https://acme.com"
        />
        <Textarea label={t('notes', 'Notes')} name="notes" />

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
              : t('create_client', 'Create client')}
          </button>
        </div>
      </form>
    </FormProvider>
  );
};
