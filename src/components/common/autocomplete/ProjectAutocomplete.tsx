import { useMemo } from 'react';
import { CustomAutocomplete, type CustomAutocompleteProps } from './CustomAutocomplete';
import { useLanguage } from '../../../context/LanguageContext';
import type { Project } from '../../../types';

export interface ProjectAutocompleteProps<
  Multiple extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false
> extends Omit<
    CustomAutocompleteProps<Project, Multiple, FreeSolo>,
    'entity' | 'valueMode'
  > {
  clientId?: string;
  clientName?: string;
  valueMode?: 'name' | 'id' | 'object';
}

export function ProjectAutocomplete<
  Multiple extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false
>({
  clientId,
  clientName,
  queryParams,
  label,
  placeholder,
  valueMode = 'id',
  value,
  onChange,
  getOptionLabel,
  ...restProps
}: ProjectAutocompleteProps<Multiple, FreeSolo>) {
  const { t } = useLanguage();

  const mergedQueryParams = useMemo(() => {
    const q: Record<string, any> = { ...queryParams };
    if (clientId) q.clientId = clientId;
    if (clientName) q.clientName = clientName;
    return q;
  }, [queryParams, clientId, clientName]);

  const defaultGetOptionLabel = (p: Project | string) => {
    if (typeof p === 'string') return p;
    if ((p as any)?.__isLoadMoreSentinel || p?.id === '__LOAD_MORE__') return '';
    return p.name || (p as any)?.projectName || '';
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
    <CustomAutocomplete<Project, Multiple, FreeSolo>
      entity="projects"
      valueMode={valueMode === 'name' ? 'object' : valueMode}
      value={
        valueMode === 'name' && typeof value === 'string' && value
          ? ({ name: value } as any)
          : value
      }
      onChange={handleCustomChange}
      label={label !== undefined ? label : t('colProject')}
      placeholder={placeholder !== undefined ? placeholder : t('phProjectName')}
      queryParams={mergedQueryParams}
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
