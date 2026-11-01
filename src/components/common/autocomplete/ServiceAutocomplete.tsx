import React, { useCallback, useMemo } from 'react';
import { CustomAutocomplete, type CustomAutocompleteProps } from './CustomAutocomplete';
import { useLanguage } from '../../../context/LanguageContext';
import { useServiceDetailsQuery } from '../../../queries';
import type { Service } from '../../../types';

export interface ServiceAutocompleteProps<
  Multiple extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false
> extends Omit<
    CustomAutocompleteProps<Service, Multiple, FreeSolo>,
    'entity'
  > {}

function ServiceAutocompleteInner<
  Multiple extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false
>({
  valueMode = 'code',
  label,
  placeholder,
  getOptionLabel,
  initialOption: initialOptionProp,
  value,
  ...restProps
}: ServiceAutocompleteProps<Multiple, FreeSolo>) {
  const { t, getServiceLabel } = useLanguage();

  const serviceIdToFetch =
    !initialOptionProp && !restProps.multiple && typeof value === 'string' && value.trim()
      ? value.trim()
      : undefined;

  const { data: autoFetchedService } = useServiceDetailsQuery(
    serviceIdToFetch,
    Boolean(serviceIdToFetch)
  );

  const resolvedInitialOption = useMemo(() => {
    if (initialOptionProp) return initialOptionProp;
    if (autoFetchedService) {
      return Array.isArray(autoFetchedService) ? autoFetchedService[0] : autoFetchedService;
    }
    return null;
  }, [initialOptionProp, autoFetchedService]);

  const defaultGetOptionLabel = useCallback(
    (option: Service | string) => {
      if (typeof option === 'string') return option;
      if ((option as any)?.__isLoadMoreSentinel || option?.id === '__LOAD_MORE__') return '';
      return option.name || (option.code ? getServiceLabel(option.code) : '') || option.code || '';
    },
    [getServiceLabel]
  );

  const defaultIsOptionEqualToValue = useCallback((option: Service, val: any) => {
    if (!option || !val) return option === val;
    if (typeof val === 'string') {
      return option.code === val || option.id === val || option.name === val;
    }
    if (option.code && val.code) return option.code === val.code;
    if (option.id && val.id) return option.id === val.id;
    return option === val;
  }, []);

  return (
    <CustomAutocomplete<Service, Multiple, FreeSolo>
      entity="services"
      valueMode={valueMode}
      value={value}
      initialOption={resolvedInitialOption}
      label={label !== undefined ? label : t('lblService')}
      placeholder={placeholder !== undefined ? placeholder : t('phServiceName')}
      getOptionLabel={getOptionLabel || defaultGetOptionLabel}
      isOptionEqualToValue={defaultIsOptionEqualToValue}
      {...restProps}
    />
  );
}

export const ServiceAutocomplete = React.memo(ServiceAutocompleteInner) as <
  Multiple extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false
>(
  props: ServiceAutocompleteProps<Multiple, FreeSolo>
) => React.ReactElement | null;
