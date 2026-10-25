import { useMemo } from 'react';
import { CustomAutocomplete, type CustomAutocompleteProps } from './CustomAutocomplete';
import { useLanguage } from '../../../context/LanguageContext';
import type { Permit } from '../../../types';

export interface PermitAutocompleteProps<
  Multiple extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false
> extends Omit<
    CustomAutocompleteProps<Permit, Multiple, FreeSolo>,
    'entity' | 'valueMode'
  > {
  clientId?: string;
  valueMode?: 'id' | 'name' | 'object';
}

export function PermitAutocomplete<
  Multiple extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false
>({
  clientId,
  queryParams,
  label,
  placeholder,
  valueMode = 'id',
  value,
  onChange,
  getOptionLabel,
  ...restProps
}: PermitAutocompleteProps<Multiple, FreeSolo>) {
  const { t } = useLanguage();

  const mergedQueryParams = useMemo(() => {
    const q: Record<string, any> = { ...queryParams };
    if (clientId) q.clientId = clientId;
    return q;
  }, [queryParams, clientId]);

  const defaultGetOptionLabel = (permit: Permit | string) => {
    if (typeof permit === 'string') return permit;
    if ((permit as any)?.__isLoadMoreSentinel || permit?.id === '__LOAD_MORE__') return '';
    return permit.permitNumber || '';
  };

  const handleCustomChange = (val: any, opt?: any) => {
    if (valueMode === 'name') {
      if (typeof val === 'string') {
        onChange(val, opt);
      } else if (val && typeof val === 'object' && val.permitNumber) {
        onChange(val.permitNumber, val);
      } else {
        onChange(val ? val.permitNumber || '' : '', opt);
      }
      return;
    }
    onChange(val, opt);
  };

  return (
    <CustomAutocomplete<Permit, Multiple, FreeSolo>
      entity="permits"
      valueMode={valueMode === 'name' ? 'object' : valueMode}
      value={
        valueMode === 'name' && typeof value === 'string' && value
          ? ({ permitNumber: value } as any)
          : value
      }
      onChange={handleCustomChange}
      label={label !== undefined ? label : t('tabPermits')}
      placeholder={placeholder !== undefined ? placeholder : t('phSelectPermit')}
      queryParams={mergedQueryParams}
      getOptionLabel={getOptionLabel || defaultGetOptionLabel}
      isOptionEqualToValue={(option, val) => {
        if (!option || !val) return option === val;
        if (typeof val === 'string') {
          return option.id === val || option.permitNumber === val;
        }
        if (option.id && val.id) return option.id === val.id;
        if (option.permitNumber && val.permitNumber) {
          return option.permitNumber === val.permitNumber;
        }
        return option === val;
      }}
      {...restProps}
    />
  );
}
