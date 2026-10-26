import { CustomAutocomplete, type CustomAutocompleteProps } from './CustomAutocomplete';
import { useLanguage } from '../../../context/LanguageContext';
import type { Category } from '../../../types';

export interface CategoryAutocompleteProps<
  Multiple extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false
> extends Omit<
    CustomAutocompleteProps<Category, Multiple, FreeSolo>,
    'entity' | 'valueMode'
  > {
  valueMode?: 'name' | 'id' | 'object';
}

export function CategoryAutocomplete<
  Multiple extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false
>({
  label,
  placeholder,
  valueMode = 'id',
  value,
  onChange,
  getOptionLabel,
  ...restProps
}: CategoryAutocompleteProps<Multiple, FreeSolo>) {
  const { t } = useLanguage();

  const defaultGetOptionLabel = (c: Category | string) => {
    if (typeof c === 'string') return c;
    if ((c as any)?.__isLoadMoreSentinel || c?.id === '__LOAD_MORE__') return '';
    return c.name || '';
  };

  const handleCustomChange = (val: any, opt?: any) => {
    if (valueMode === 'name') {
      if (typeof val === 'string') {
        onChange(val, opt);
      } else if (val && typeof val === 'object' && val.name) {
        onChange(val.name, val);
      } else {
        onChange(val ? val.name || '' : '', opt);
      }
      return;
    }
    onChange(val, opt);
  };

  return (
    <CustomAutocomplete<Category, Multiple, FreeSolo>
      entity="categories"
      valueMode={valueMode === 'name' ? 'object' : valueMode}
      value={
        valueMode === 'name' && typeof value === 'string' && value
          ? ({ name: value } as any)
          : value
      }
      onChange={handleCustomChange}
      label={label !== undefined ? label : t('colCategory')}
      placeholder={placeholder !== undefined ? placeholder : t('colCategory')}
      getOptionLabel={getOptionLabel || defaultGetOptionLabel}
      isOptionEqualToValue={(option, val) => {
        if (!option || !val) return option === val;
        if (typeof val === 'string') {
          return option.id === val || option.name === val;
        }
        if (option.id && val.id) return option.id === val.id;
        if (option.name && val.name) return option.name === val.name;
        return option === val;
      }}
      {...restProps}
    />
  );
}
