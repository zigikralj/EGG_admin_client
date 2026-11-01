import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { API_ROUTES } from '../constants';
import { useAuthHeaders } from './queryUtils';

export function useSystemSettingsQuery() {
  const getAuthHeaders = useAuthHeaders();
  return useQuery<Record<string, any>>({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const res = await apiFetch(API_ROUTES.SYSTEM_SETTINGS.BASE, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch system settings');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useWasteDisposalServiceId() {
  const { data: systemSettings = {}, isLoading } = useSystemSettingsQuery();
  const serviceId = (systemSettings['waste_disposal_service_id'] as string | undefined)?.trim() || '';
  return { wasteDisposalServiceId: serviceId, isLoading };
}

export function useSystemSettingsMutations() {
  const queryClient = useQueryClient();
  const getAuthHeaders = useAuthHeaders();

  const updateSettingMutation = useMutation({
    mutationKey: ['system-settings'],
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const res = await apiFetch(API_ROUTES.SYSTEM_SETTINGS.BY_KEY(key), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error('Failed to update system setting');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      queryClient.invalidateQueries({ queryKey: ['provided-services'] });
    },
  });

  return { updateSettingMutation };
}

