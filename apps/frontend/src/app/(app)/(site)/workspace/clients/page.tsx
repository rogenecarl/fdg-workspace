import { Metadata } from 'next';
import { ClientsListComponent } from '@gitroom/frontend/components/workspace/clients.list.component';

export const metadata: Metadata = {
  title: 'Clients',
  description: '',
};

export default async function Page() {
  return <ClientsListComponent />;
}
