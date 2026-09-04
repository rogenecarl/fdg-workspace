'use client';

import useSWR from 'swr';
import { useCallback } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

export const useTasks = (projectId: string) => {
  const fetch = useFetch();

  const load = useCallback(async () => {
    return (await fetch(`/workspace/tasks?projectId=${projectId}`)).json();
  }, [projectId]);

  return useSWR(`workspace-tasks-${projectId}`, load);
};
