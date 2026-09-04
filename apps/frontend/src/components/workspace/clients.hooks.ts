'use client';

import useSWR from 'swr';
import { useCallback } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

// One useSWR per hook, per the repository's rules. Do not add a second query
// to this file - give it its own hook so react-hooks/rules-of-hooks holds.
export const useClients = (includeArchived = false) => {
  const fetch = useFetch();

  const load = useCallback(async () => {
    return (
      await fetch(`/workspace/clients?includeArchived=${includeArchived}`)
    ).json();
  }, [includeArchived]);

  return useSWR(`workspace-clients-${includeArchived}`, load);
};
