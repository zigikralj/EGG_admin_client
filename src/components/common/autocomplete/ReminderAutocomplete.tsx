import { useMemo, type Key, type HTMLAttributes } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { CustomAutocomplete, type CustomAutocompleteProps } from './CustomAutocomplete';
import { useLanguage } from '../../../context/LanguageContext';
import type { Reminder } from '../../../types';

export interface ReminderAutocompleteProps<
  Multiple extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false
> extends Omit<
    CustomAutocompleteProps<Reminder, Multiple, FreeSolo>,
    'entity'
  > {
  prioritizeClientId?: string | null;
  prioritizeClientName?: string | null;
  excludeProjectId?: string | null;
  excludePermitId?: string | null;
  excludeIds?: string[];
}

export function ReminderAutocomplete<
  Multiple extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false
>({
  prioritizeClientId,
  prioritizeClientName,
  excludeProjectId,
  excludePermitId,
  excludeIds,
  queryParams,
  label,
  placeholder,
  valueMode = 'id',
  getOptionLabel,
  groupBy,
  renderOption,
  ...restProps
}: ReminderAutocompleteProps<Multiple, FreeSolo>) {
  const { t } = useLanguage();

  const mergedQueryParams = useMemo(() => {
    const q: Record<string, any> = { ...queryParams };
    if (prioritizeClientId) q.prioritizeClientId = prioritizeClientId;
    if (prioritizeClientName) q.prioritizeClientName = prioritizeClientName;
    if (excludeProjectId) q.excludeProjectId = excludeProjectId;
    if (excludePermitId) q.excludePermitId = excludePermitId;
    if (excludeIds && excludeIds.length > 0) q.excludeIds = excludeIds.join(',');
    return q;
  }, [
    queryParams,
    prioritizeClientId,
    prioritizeClientName,
    excludeProjectId,
    excludePermitId,
    excludeIds,
  ]);

  const defaultGetOptionLabel = (r: Reminder | string) => {
    if (typeof r === 'string') return r;
    if ((r as any)?.__isLoadMoreSentinel || r?.id === '__LOAD_MORE__') return '';
    return `${r.title || r.projectName || t('tabReminders')}${r.dueDate ? ` (${r.dueDate})` : ''}${r.clientName ? ` - ${r.clientName}` : ''}`;
  };

  const defaultGroupBy = (r: Reminder) => {
    if ((r as any)?.__isLoadMoreSentinel || r?.id === '__LOAD_MORE__') return '';
    const targetClientId = prioritizeClientId;
    const targetClientName = (prioritizeClientName || '').trim().toLowerCase();
    const isMatch =
      Boolean(targetClientId && r.clientId === targetClientId) ||
      Boolean(targetClientName && r.clientName && r.clientName.trim().toLowerCase() === targetClientName);
    return isMatch ? `${t('colClient')}: ${prioritizeClientName || ''}` : t('other');
  };

  const defaultRenderOption = (
    props: HTMLAttributes<HTMLLIElement> & { key?: Key },
    r: Reminder
  ) => {
    const { key, ...otherProps } = props as any;
    const targetClientId = prioritizeClientId;
    const targetClientName = (prioritizeClientName || '').trim().toLowerCase();
    const isMatch =
      Boolean(targetClientId && r.clientId === targetClientId) ||
      Boolean(targetClientName && r.clientName && r.clientName.trim().toLowerCase() === targetClientName);

    return (
      <Box component="li" key={key || r.id} {...otherProps}>
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', py: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: isMatch ? 700 : 500 }}>
              {r.title || r.projectName || '—'}
            </Typography>
            {isMatch && (
              <Chip
                label={t('colClient')}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25, flexWrap: 'wrap' }}>
            {r.dueDate && (
              <Typography variant="caption" color="text.secondary">
                {t('lblDueDate')}: {r.dueDate}
              </Typography>
            )}
            {r.clientName && (
              <Typography variant="caption" color="text.secondary">
                • {r.clientName}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <CustomAutocomplete<Reminder, Multiple, FreeSolo>
      entity="reminders"
      valueMode={valueMode}
      label={label !== undefined ? label : t('tabReminders')}
      placeholder={placeholder !== undefined ? placeholder : t('phSelectExistingReminder')}
      queryParams={mergedQueryParams}
      getOptionLabel={getOptionLabel || defaultGetOptionLabel}
      groupBy={groupBy}
      renderOption={renderOption || defaultRenderOption}
      {...restProps}
    />
  );
}
