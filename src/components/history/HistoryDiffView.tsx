import React from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { formatDiffValue } from '../activityLogs/utils';

import { stripHtmlToText } from '../common/RichTextEditor';

interface DiffPart {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

function tokenize(text: string): string[] {
  if (!text) return [];
  return text.split(/(\s+)/).filter(Boolean);
}

export function computeWordDiff(textA: string, textB: string): DiffPart[] {
  const a = tokenize(textA);
  const b = tokenize(textB);

  if (a.length === 0 && b.length === 0) return [];
  if (a.length === 0) return b.map((t) => ({ type: 'added', text: t }));
  if (b.length === 0) return a.map((t) => ({ type: 'removed', text: t }));

  const N = Math.min(a.length, 1000);
  const M = Math.min(b.length, 1000);

  const dp: number[][] = Array.from({ length: N + 1 }, () => new Array(M + 1).fill(0));

  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= M; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const parts: DiffPart[] = [];
  let i = N;
  let j = M;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      parts.unshift({ type: 'unchanged', text: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      parts.unshift({ type: 'added', text: b[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      parts.unshift({ type: 'removed', text: a[i - 1] });
      i--;
    }
  }

  // Combine adjacent identical diff parts for cleaner DOM
  const merged: DiffPart[] = [];
  for (const part of parts) {
    if (merged.length > 0 && merged[merged.length - 1].type === part.type) {
      merged[merged.length - 1].text += part.text;
    } else {
      merged.push({ ...part });
    }
  }

  return merged;
}

export const NotesWordDiffView: React.FC<{
  oldHtml: string | null | undefined;
  newHtml: string | null | undefined;
  isDark?: boolean;
}> = ({ oldHtml, newHtml, isDark = false }) => {
  const oldText = typeof oldHtml === 'string' ? stripHtmlToText(oldHtml) : '';
  const newText = typeof newHtml === 'string' ? stripHtmlToText(newHtml) : '';

  const parts = React.useMemo(() => computeWordDiff(oldText, newText), [oldText, newText]);

  if (parts.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.82rem' }}>
        (prazno / bez promena)
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        mt: 0.5,
        p: 1.25,
        borderRadius: 1,
        bgcolor: isDark ? alpha('#1e293b', 0.6) : alpha('#f1f5f9', 0.9),
        border: '1px solid',
        borderColor: 'divider',
        fontSize: '0.84rem',
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontFamily: 'inherit',
      }}
    >
      {parts.map((part, idx) => {
        if (part.type === 'added') {
          return (
            <Box
              key={idx}
              component="span"
              sx={{
                bgcolor: isDark ? alpha('#22c55e', 0.25) : alpha('#22c55e', 0.16),
                color: isDark ? '#4ade80' : '#15803d',
                fontWeight: 600,
                px: 0.35,
                py: 0.1,
                borderRadius: '3px',
              }}
            >
              {part.text}
            </Box>
          );
        }
        if (part.type === 'removed') {
          return (
            <Box
              key={idx}
              component="span"
              sx={{
                bgcolor: isDark ? alpha('#ef4444', 0.22) : alpha('#ef4444', 0.14),
                color: isDark ? '#f87171' : '#b91c1c',
                textDecoration: 'line-through',
                px: 0.35,
                py: 0.1,
                borderRadius: '3px',
              }}
            >
              {part.text}
            </Box>
          );
        }
        return (
          <Box key={idx} component="span" sx={{ color: 'text.primary' }}>
            {part.text}
          </Box>
        );
      })}
    </Box>
  );
};

export interface HistoryDiffViewProps {
  diff?: Record<string, { old: any; new: any }> | null;
  isDark?: boolean;
  language?: string;
  emptyMessage?: string;
}

export const HistoryDiffView: React.FC<HistoryDiffViewProps> = ({
  diff,
  isDark = false,
  language = 'en',
  emptyMessage,
}) => {
  if (!diff || typeof diff !== 'object') {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
        {emptyMessage || (language === 'en' ? 'No difference detected.' : 'Nema detektovanih razlika.')}
      </Typography>
    );
  }

  const entries = Object.entries(diff).filter(([_, val]) => {
    if (val && typeof val === 'object' && ('old' in val || 'new' in val)) {
      return JSON.stringify(val.old) !== JSON.stringify(val.new);
    }
    return true;
  });

  if (entries.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
        {emptyMessage || (language === 'en' ? 'No fields modified between these versions.' : 'Nema izmenjenih polja između ovih verzija.')}
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        mt: 1,
        p: 1.5,
        bgcolor: isDark ? alpha('#000000', 0.35) : alpha('#f8fafc', 0.9),
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.8,
        width: '100%',
      }}
    >
      {entries.map(([key, val]) => {
        // Skip redundant preview diff if full notes diff is present
        if (key === 'notesPreview' && diff['notes']) return null;

        const isOldNew = val && typeof val === 'object' && ('old' in val || 'new' in val);
        const hasOld = isOldNew && val.old !== undefined && val.old !== null;
        const hasNew = isOldNew && val.new !== undefined && val.new !== null;

        if (key === 'notes') {
          return (
            <Box
              key={key}
              sx={{
                width: '100%',
                py: 0.5,
                borderBottom: '1px dashed',
                borderColor: alpha(isDark ? '#ffffff' : '#000000', 0.08),
                '&:last-child': { borderBottom: 'none' },
              }}
            >
              <Typography
                component="div"
                sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                  fontSize: '0.84rem',
                  mb: 0.25,
                }}
              >
                {key}:
              </Typography>
              <NotesWordDiffView oldHtml={val.old} newHtml={val.new} isDark={isDark} />
            </Box>
          );
        }

        return (
          <Box
            key={key}
            sx={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 1,
              fontSize: '0.82rem',
              fontFamily: 'monospace',
              lineHeight: 1.5,
              flexWrap: 'wrap',
              py: 0.25,
              borderBottom: '1px dashed',
              borderColor: alpha(isDark ? '#ffffff' : '#000000', 0.08),
              '&:last-child': { borderBottom: 'none' },
            }}
          >
            <Typography
              component="span"
              sx={{
                fontWeight: 700,
                color: 'text.secondary',
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                minWidth: 120,
              }}
            >
              {key}:
            </Typography>

            {isOldNew ? (
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                {hasOld && (
                  <Typography
                    component="span"
                    sx={{
                      textDecoration: 'line-through',
                      color: isDark ? '#f87171' : '#dc2626',
                      bgcolor: isDark ? alpha('#ef4444', 0.15) : alpha('#ef4444', 0.1),
                      px: 0.6,
                      py: 0.2,
                      borderRadius: 0.8,
                      fontFamily: 'monospace',
                      fontSize: '0.82rem',
                    }}
                  >
                    {formatDiffValue(val.old)}
                  </Typography>
                )}
                {hasOld && hasNew && (
                  <Typography
                    component="span"
                    sx={{
                      color: 'text.disabled',
                      fontSize: '0.82rem',
                      userSelect: 'none',
                    }}
                  >
                    →
                  </Typography>
                )}
                {hasNew && (
                  <Typography
                    component="span"
                    sx={{
                      color: isDark ? '#4ade80' : '#16a34a',
                      bgcolor: isDark ? alpha('#22c55e', 0.15) : alpha('#22c55e', 0.1),
                      px: 0.6,
                      py: 0.2,
                      borderRadius: 0.8,
                      fontWeight: 600,
                      fontFamily: 'monospace',
                      fontSize: '0.82rem',
                    }}
                  >
                    {formatDiffValue(val.new)}
                  </Typography>
                )}
                {!hasOld && !hasNew && (
                  <Typography
                    component="span"
                    sx={{ color: 'text.disabled', fontFamily: 'monospace', fontSize: '0.82rem' }}
                  >
                    (empty)
                  </Typography>
                )}
              </Box>
            ) : (
              <Typography
                component="span"
                sx={{
                  color: isDark ? '#4ade80' : '#16a34a',
                  fontWeight: 600,
                  fontFamily: 'monospace',
                  fontSize: '0.82rem',
                }}
              >
                {formatDiffValue(val)}
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
};
