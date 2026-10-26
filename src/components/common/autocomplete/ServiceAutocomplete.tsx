import { CustomAutocomplete, type CustomAutocompleteProps } from './CustomAutocomplete';
import { useLanguage } from '../../../context/LanguageContext';
import type { Service } from '../../../types';

export interface ServiceAutocompleteProps<
  Multiple extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false
> extends Omit<
    CustomAutocompleteProps<Service, Multiple, FreeSolo>,
    'entity'
  > {}

export function ServiceAutocomplete<
  Multiple extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false
>({
  valueMode = 'code',
  label,
  placeholder,
  getOptionLabel,
  ...restProps
}: ServiceAutocompleteProps<Multiple, FreeSolo>) {
  const { t, getServiceLabel } = useLanguage();

  const defaultGetOptionLabel = (option: Service | string) => {
    if (typeof option === 'string') return option;
    if ((option as any)?.__isLoadMoreSentinel || option?.id === '__LOAD_MORE__') return '';
    return option.name || (option.code ? getServiceLabel(option.code) : '') || option.code || '';
  };

  return (
    <CustomAutocomplete<Service, Multiple, FreeSolo>
      entity="services"
      valueMode={valueMode}
      label={label !== undefined ? label : t('lblService')}
      placeholder={placeholder !== undefined ? placeholder : t('phServiceName')}
      getOptionLabel={getOptionLabel || defaultGetOptionLabel}
      isOptionEqualToValue={(option, val) => {
        if (!option || !val) return option === val;
        if (typeof val === 'string') {
          return option.code === val || option.id === val || option.name === val;
        }
        if (option.code && val.code) return option.code === val.code;
        if (option.id && val.id) return option.id === val.id;
        return option === val;
      }}
      {...restProps}
    />
  );
}
