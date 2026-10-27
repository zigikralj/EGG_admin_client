import React, { useMemo, useCallback } from 'react';
import { CustomAutocomplete, type CustomAutocompleteProps } from './CustomAutocomplete';
import { useLanguage } from '../../../context/LanguageContext';
import type { Client } from '../../../types';

export interface ClientAutocompleteProps<
  Multiple extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false
> extends Omit<
    CustomAutocompleteProps<Client, Multiple, FreeSolo>,
    'entity'
  > {
  showCity?: boolean;
  permitTypeFilter?: string;
}

function ClientAutocompleteInner<
  Multiple extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false
>({
  showCity = false,
  permitTypeFilter,
  queryParams,
  label,
  placeholder,
  valueMode = 'id',
  getOptionLabel,
  ...restProps
}: ClientAutocompleteProps<Multiple, FreeSolo>) {
  const { t } = useLanguage();

  const mergedQueryParams = useMemo(() => {
    if (!queryParams && !permitTypeFilter) return undefined;
    const q: Record<string, any> = { ...queryParams };
    if (permitTypeFilter) {
      q.permitType = permitTypeFilter;
    }
    return q;
  }, [queryParams, permitTypeFilter]);

  const defaultGetOptionLabel = useCallback(
    (option: Client | string) => {
      if (typeof option === 'string') return option;
      if ((option as any)?.__isLoadMoreSentinel || option?.id === '__LOAD_MORE__') return '';
      if (showCity && option.city) {
        return `${option.name} (${option.city})`;
      }
      return option.name || '';
    },
    [showCity]
  );

  return (
    <CustomAutocomplete<Client, Multiple, FreeSolo>
      entity="clients"
      valueMode={valueMode}
      label={label !== undefined ? label : t('lblClient')}
      placeholder={placeholder !== undefined ? placeholder : t('phClient')}
      queryParams={mergedQueryParams}
      getOptionLabel={getOptionLabel || defaultGetOptionLabel}
      {...restProps}
    />
  );
}

export const ClientAutocomplete = React.memo(ClientAutocompleteInner) as <
  Multiple extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false
>(
  props: ClientAutocompleteProps<Multiple, FreeSolo>
) => React.ReactElement | null;
