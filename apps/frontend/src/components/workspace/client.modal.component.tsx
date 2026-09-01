'use client';

import React, { FC, useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { object, string } from 'yup';
import { Button } from '@gitroom/react/form/button';
import { Input } from '@gitroom/react/form/input';
import { Textarea } from '@gitroom/react/form/textarea';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { useToaster } from '@gitroom/react/toaster/toaster';

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
      // The DTO validates contactEmail as an email and website as a URL, so
      // empty strings would fail validation. Drop them instead of sending "".
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
        toaster.show('Could not save the client', 'warning');
        return;
      }

      toaster.show(data ? 'Client updated' : 'Client created', 'success');
      reload();
      modal.closeAll();
    },
    [data, reload]
  );

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        className="flex flex-col gap-[16px] w-full"
      >
        <Input label="Name" name="name" placeholder="Acme Ltd" />
        <Input label="Contact name" name="contactName" placeholder="Jane Doe" />
        <Input
          label="Contact email"
          name="contactEmail"
          placeholder="jane@acme.com"
        />
        <Input label="Website" name="website" placeholder="https://acme.com" />
        <Textarea label="Notes" name="notes" />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {data ? 'Save changes' : 'Create client'}
        </Button>
      </form>
    </FormProvider>
  );
};
