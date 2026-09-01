import { Metadata } from 'next';
import { TaskBoardComponent } from '@gitroom/frontend/components/workspace/task.board.component';

export const metadata: Metadata = {
  title: 'Board',
  description: '',
};

export default async function Page(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return <TaskBoardComponent projectId={id} />;
}
