import { Metadata } from 'next';
import { ProjectsListComponent } from '@gitroom/frontend/components/workspace/projects.list.component';

export const metadata: Metadata = {
  title: 'Projects',
  description: '',
};

export default async function Page() {
  return <ProjectsListComponent />;
}
