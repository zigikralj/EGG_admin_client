import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { API_ROUTES } from '../constants';
import type { CompanyInfo } from '../types';

export function useCompanyInfoQuery(enabled = true) {
  return useQuery<CompanyInfo>({
    queryKey: ['company-info'],
    enabled,
    queryFn: async () => {
      const res = await apiFetch(API_ROUTES.COMPANY_INFO.BASE);
      if (!res.ok) throw new Error('Failed to fetch company info');
      const data = await res.json();
      return {
        id: data?.id || 'default',
        name: data?.name || '',
        legalName: data?.legalName || '',
        registrationNumber: data?.registrationNumber || '',
        municipality: data?.municipality || '',
        city: data?.city || '',
        streetAddress: data?.streetAddress || '',
        postalCode: data?.postalCode || '',
        postOffice: data?.postOffice || '',
        email: data?.email || '',
        taxId: data?.taxId || '',
        activityCode: data?.activityCode || '',
        bankAccounts: Array.isArray(data?.bankAccounts) ? data.bankAccounts : [],
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCompanyInfoMutations() {
  const queryClient = useQueryClient();

  const updateCompanyInfoMutation = useMutation({
    mutationKey: ['company-info'],
    mutationFn: async (payload: Partial<CompanyInfo>) => {
      const res = await apiFetch(API_ROUTES.COMPANY_INFO.BASE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update company info');
      return res.json() as Promise<CompanyInfo>;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['company-info'], updated);
      queryClient.invalidateQueries({ queryKey: ['company-info'] });
    },
  });

  return { updateCompanyInfoMutation };
}

