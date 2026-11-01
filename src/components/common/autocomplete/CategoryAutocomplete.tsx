import { useMemo, useCallback } from 'react';
import { CustomAutocomplete, type CustomAutocompleteProps } from './CustomAutocomplete';
import { useLanguage } from '../../../context/LanguageContext';
import { useCategoriesQuery } from '../../../queries';
import type { Category } from '../../../types';

export interface CategoryAutocompleteProps<
  Multiple extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false
> extends Omit<
    CustomAutocompleteProps<Category, Multiple, FreeSolo>,
    'entity'
  > {
  valueMode?: 'name' | 'id' | 'code' | 'object';
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
  initialOption: initialOptionProp,
  ...restProps
}: CategoryAutocompleteProps<Multiple, FreeSolo>) {
  const { t } = useLanguage();
  const { data: categories = [] } = useCategoriesQuery();

  const resolvedInitialOption = useMemo(() => {
    if (initialOptionProp) return initialOptionProp;
    if (!value) return null;
    if (typeof value === 'object') return value;
    const found = categories.find(
      (c) => c.code === value || c.id === value || c.name === value
    );
    return found || null;
  }, [initialOptionProp, value, categories]);

  const defaultGetOptionLabel = useCallback((c: Category | string) => {
    if (typeof c === 'string') return c;
    if ((c as any)?.__isLoadMoreSentinel || c?.id === '__LOAD_MORE__') return '';
    return c.name || c.code || '';
  }, []);

  const defaultIsOptionEqualToValue = useCallback((option: Category, val: any) => {
    if (!option || !val) return option === val;
    if (typeof val === 'string') {
      return option.id === val || option.code === val || option.name === val;
    }
    if (option.id && val.id) return option.id === val.id;
    if (option.code && val.code) return option.code === val.code;
    if (option.name && val.name) return option.name === val.name;
    return option === val;
  }, []);

  return (
    <CustomAutocomplete<Category, Multiple, FreeSolo>
      entity="categories"
      valueMode={valueMode}
      value={value}
      initialOption={resolvedInitialOption}
      onChange={onChange}
      label={label !== undefined ? label : t('colCategory')}
      placeholder={placeholder !== undefined ? placeholder : t('colCategory')}
      getOptionLabel={getOptionLabel || defaultGetOptionLabel}
      isOptionEqualToValue={restProps.isOptionEqualToValue || defaultIsOptionEqualToValue}
      {...restProps}
    />
  );
}
