import { useMemo } from 'react';
import { CustomAutocomplete, type CustomAutocompleteProps } from './CustomAutocomplete';
import { useLanguage } from '../../../context/LanguageContext';
import type { ProvidedService } from '../../../types';

export interface ProvidedServiceAutocompleteProps<
  Multiple extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false
> extends Omit<
    CustomAutocompleteProps<ProvidedService, Multiple, FreeSolo>,
    'entity' | 'valueMode'
  > {
  clientId?: string;
  projectId?: string;
  serviceId?: string;
  missingInvoice?: boolean;
  valueMode?: 'id' | 'object';
}

export function ProvidedServiceAutocomplete<
  Multiple extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false
>({
  clientId,
  projectId,
  serviceId,
  missingInvoice,
  queryParams,
  label,
  placeholder,
  valueMode = 'id',
  value,
  onChange,
  getOptionLabel,
  ...restProps
}: ProvidedServiceAutocompleteProps<Multiple, FreeSolo>) {
  const { t } = useLanguage();

  const mergedQueryParams = useMemo(() => {
    const q: Record<string, any> = { ...queryParams };
    if (clientId) q.clientId = clientId;
    if (projectId) q.projectId = projectId;
    if (serviceId) q.serviceId = serviceId;
    if (missingInvoice !== undefined) q.missingInvoice = missingInvoice;
    return q;
  }, [queryParams, clientId, projectId, serviceId, missingInvoice]);

  const defaultGetOptionLabel = (ps: ProvidedService | string) => {
    if (typeof ps === 'string') return ps;
    if ((ps as any)?.__isLoadMoreSentinel || (ps as any)?.id === '__LOAD_MORE__') return '';
    const serviceName = ps.service?.name || ps.serviceId || t('colService') || 'Service';
    const loc = ps.location ? ` - ${ps.location}` : '';
    const date = ps.scheduledDate ? ` (${ps.scheduledDate.slice(0, 10)})` : '';
    return `${serviceName}${loc}${date}`;
  };

  return (
    <CustomAutocomplete<ProvidedService, Multiple, FreeSolo>
      entity="providedServices"
      valueMode={valueMode}
      value={value}
      onChange={onChange}
      queryParams={mergedQueryParams}
      label={label !== undefined ? label : t('tabProvidedServices')}
      placeholder={placeholder !== undefined ? placeholder : t('tabProvidedServices')}
      getOptionLabel={getOptionLabel || defaultGetOptionLabel}
      {...restProps}
    />
  );
}
