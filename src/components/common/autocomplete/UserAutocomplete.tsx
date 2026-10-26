import { useMemo } from 'react';
import { CustomAutocomplete, type CustomAutocompleteProps } from './CustomAutocomplete';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import type { User } from '../../../types';

export interface UserAutocompleteProps<
  Multiple extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false
> extends Omit<
    CustomAutocompleteProps<User, Multiple, FreeSolo>,
    'entity' | 'valueMode'
  > {
  forAssignee?: boolean;
  includeUserName?: string;
  useResponsibleLabel?: boolean;
  valueMode?: 'name' | 'id' | 'object';
  restrictedPermission?: string;
}

export function UserAutocomplete<
  Multiple extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false
>({
  forAssignee = true,
  includeUserName,
  useResponsibleLabel = true,
  valueMode = 'name',
  restrictedPermission,
  queryParams,
  label,
  placeholder,
  disabled,
  value,
  onChange,
  getOptionLabel,
  ...restProps
}: UserAutocompleteProps<Multiple, FreeSolo>) {
  const { t, getResponsibleLabel } = useLanguage();
  const { currentUser, isRestrictedToOwn } = useAuth();

  const isRestricted = useMemo(() => {
    if (!restrictedPermission) return false;
    return isRestrictedToOwn(restrictedPermission);
  }, [restrictedPermission, isRestrictedToOwn]);

  const effectiveDisabled = disabled || isRestricted;

  // Resolve includeUserName from props, value, or initialOption
  const effectiveIncludeUserName = useMemo(() => {
    if (includeUserName) return includeUserName;
    if (typeof value === 'string' && valueMode === 'name') return value;
    if (value && typeof value === 'object' && value.name) return value.name;
    return undefined;
  }, [includeUserName, value, valueMode]);

  const mergedQueryParams = useMemo(() => {
    const q: Record<string, any> = { ...queryParams };
    if (forAssignee) {
      q.forAssignee = true;
    }
    if (effectiveIncludeUserName) {
      q.includeUserName = effectiveIncludeUserName;
    }
    return q;
  }, [queryParams, forAssignee, effectiveIncludeUserName]);

  const computedLabel = useMemo(() => {
    if (label !== undefined) return label;
    if (useResponsibleLabel) {
      const targetUser = typeof value === 'string' ? value : value?.name || currentUser?.name || '';
      return getResponsibleLabel(targetUser);
    }
    return t('lblResponsiblePerson');
  }, [label, useResponsibleLabel, value, currentUser?.name, getResponsibleLabel, t]);

  const defaultGetOptionLabel = (option: User | string) => {
    if (typeof option === 'string') return option;
    if ((option as any)?.__isLoadMoreSentinel || option?.id === '__LOAD_MORE__') return '';
    const isMe =
      Boolean(currentUser?.name) &&
      option.name?.trim().toLowerCase() === currentUser?.name?.trim().toLowerCase();
    const namePart = isMe ? `${t('lblMe')} (${option.name})` : option.name || '';
    return option.role ? `${namePart} (${option.role})` : namePart;
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
    <CustomAutocomplete<User, Multiple, FreeSolo>
      entity="users"
      valueMode={valueMode}
      value={value}
      onChange={handleCustomChange}
      disabled={effectiveDisabled}
      label={computedLabel}
      placeholder={placeholder !== undefined ? placeholder : (currentUser?.name || t('phResponsiblePerson'))}
      queryParams={mergedQueryParams}
      getOptionLabel={getOptionLabel || defaultGetOptionLabel}
      isOptionEqualToValue={(option, val) => {
        if (!option || !val) return option === val;
        if (typeof val === 'string') {
          return (
            option.id === val ||
            option.name?.trim().toLowerCase() === val.trim().toLowerCase()
          );
        }
        if (typeof (option as any) === 'string') {
          return (
            (option as any) === val.id ||
            (option as any).trim().toLowerCase() === val.name?.trim().toLowerCase()
          );
        }
        if (option.id && val.id) return option.id === val.id;
        if (option.name && val.name) {
          return option.name.trim().toLowerCase() === val.name.trim().toLowerCase();
        }
        return option === val;
      }}
      {...restProps}
    />
  );
}
