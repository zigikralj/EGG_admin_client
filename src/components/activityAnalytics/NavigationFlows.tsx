import React from 'react';
import {
  Card,
  Box,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  alpha,
} from '@mui/material';
import type { ActivityAnalytics } from '../../types';
import { getPathLabelAndIcon } from './utils';
import { ArrowForwardIcon } from '../icons';

export interface NavigationFlowsProps {
  transitions: ActivityAnalytics['transitions'];
  entryPages: ActivityAnalytics['entryPages'];
  exitPages: ActivityAnalytics['exitPages'];
  t: (key: any) => string;
  language: string;
}

export const NavigationFlows: React.FC<NavigationFlowsProps> = ({
  transitions,
  entryPages,
  exitPages,
  t,
  language,
}) => {
  return (
    <Card
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
          {t('analyticsNavigationFlowsTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
          {t('analyticsNavigationFlowsSubtitle')}
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {/* Entry Pages */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: (th) => (th.palette.mode === 'dark' ? alpha('#10b981', 0.05) : alpha('#10b981', 0.03)),
              height: '100%',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
              {t('analyticsEntryPages')}
            </Typography>
            <List dense disablePadding>
              {entryPages.length > 0 ? (
                entryPages.slice(0, 5).map((ep, idx) => {
                  const meta = getPathLabelAndIcon(ep.path, undefined, t, language);
                  return (
                    <ListItem key={idx} disableGutters sx={{ py: 0.5 }}>
                      <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>{meta.icon}</Box>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 600 }} noWrap>
                            {meta.label}
                          </Typography>
                        }
                      />
                      <Chip
                        size="small"
                        label={ep.count}
                        sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                      />
                    </ListItem>
                  );
                })
              ) : (
                <Typography variant="caption" color="text.secondary">
                  {t('noData')}
                </Typography>
              )}
            </List>
          </Box>
        </Grid>

        {/* Transitions Hops */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
              {t('analyticsTransitions')}
            </Typography>
            <List dense disablePadding>
              {transitions.length > 0 ? (
                transitions.slice(0, 7).map((tr, idx) => {
                  const fromMeta = getPathLabelAndIcon(tr.from, undefined, t, language);
                  const toMeta = getPathLabelAndIcon(tr.to, undefined, t, language);
                  return (
                    <ListItem
                      key={idx}
                      disableGutters
                      sx={{
                        py: 0.6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px dashed',
                        borderColor: 'divider',
                        '&:last-child': { borderBottom: 'none' },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0, flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                          {fromMeta.icon}
                          <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 600 }} noWrap>
                            {fromMeta.label}
                          </Typography>
                        </Box>
                        <ArrowForwardIcon sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                          {toMeta.icon}
                          <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 600 }} noWrap>
                            {toMeta.label}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        size="small"
                        color="primary"
                        variant="outlined"
                        label={`${tr.count}×`}
                        sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, ml: 1 }}
                      />
                    </ListItem>
                  );
                })
              ) : (
                <Typography variant="caption" color="text.secondary">
                  {t('noData')}
                </Typography>
              )}
            </List>
          </Box>
        </Grid>

        {/* Exit Pages */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: (th) => (th.palette.mode === 'dark' ? alpha('#ef4444', 0.05) : alpha('#ef4444', 0.03)),
              height: '100%',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'error.main', mb: 1 }}>
              {t('analyticsExitPages')}
            </Typography>
            <List dense disablePadding>
              {exitPages.length > 0 ? (
                exitPages.slice(0, 5).map((xp, idx) => {
                  const meta = getPathLabelAndIcon(xp.path, undefined, t, language);
                  return (
                    <ListItem key={idx} disableGutters sx={{ py: 0.5 }}>
                      <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>{meta.icon}</Box>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 600 }} noWrap>
                            {meta.label}
                          </Typography>
                        }
                      />
                      <Chip
                        size="small"
                        label={xp.count}
                        sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                      />
                    </ListItem>
                  );
                })
              ) : (
                <Typography variant="caption" color="text.secondary">
                  {t('noData')}
                </Typography>
              )}
            </List>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
};
