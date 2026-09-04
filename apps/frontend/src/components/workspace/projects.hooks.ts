'use client';

import useSWR from 'swr';
import { useCallback } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

// One useSWR per hook, per the repository's rules.
export const useProjects = (clientId?: string) => {
  const fetch = useFetch();

  const load = useCallback(async () => {
    const query = clientId ? `?clientId=${clientId}` : '';
    return (await fetch(`/workspace/projects${query}`)).json();
  }, [clientId]);

  return useSWR(`workspace-projects-${clientId || 'all'}`, load);
};

export const useProject = (id: string) => {
  const fetch = useFetch();

  const load = useCallback(async () => {
    return (await fetch(`/workspace/projects/${id}`)).json();
  }, [id]);

  return useSWR(`workspace-project-${id}`, load);
};
