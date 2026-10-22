import React, { useMemo, useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import {
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip,
  Paper,
  CircularProgress,
} from '@mui/material';

import { useLanguage } from '../../context/LanguageContext';
import { stripHtmlToText } from '../common/RichTextEditor';
import { useProjectDetailsQuery } from '../../queries';
import {
  NotesIcon,
  OpenInNewIcon,
  PushPinIcon,
  PushPinOutlinedIcon,
  CloseIcon,
} from '../icons';

export interface ProjectNotesPreviewProps {
  projectId: string;
  notes?: string | null;
  notesPreview?: string | null;
  onOpenModal: () => void;
  onExpandedChange?: (expanded: boolean) => void;
}

export const ProjectNotesPreview: React.FC<ProjectNotesPreviewProps> = ({
  projectId,
  notes: initialNotes,
  notesPreview,
  onOpenModal,
  onExpandedChange,
}) => {
  const { t } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isExpanded = isLocked || isHovered;

  const { data: projectDetails, isLoading: isLoadingDetails } = useProjectDetailsQuery(
    projectId,
    isExpanded && !initialNotes
  );

  const fullNotes = initialNotes || projectDetails?.notes || null;

  const cleanText = useMemo(() => {
    if (notesPreview && notesPreview.trim()) return notesPreview.trim();
    if (fullNotes) return stripHtmlToText(fullNotes);
    return '';
  }, [notesPreview, fullNotes]);

  const restingCardRef = useRef<HTMLDivElement>(null);
  const restingTextRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const innerHtmlRef = useRef<HTMLDivElement>(null);

  const [previewCardHeight, setPreviewCardHeight] = useState<number | null>(null);
  const [restingTextHeight, setRestingTextHeight] = useState<number>(39);
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);

  const measureHeights = useCallback(() => {
    if (restingCardRef.current) {
      const ch = restingCardRef.current.offsetHeight;
      if (ch > 0) setPreviewCardHeight(ch);
    }
    if (restingTextRef.current) {
      const rh = restingTextRef.current.offsetHeight;
      if (rh > 0) setRestingTextHeight(rh);
    }
    if (innerHtmlRef.current) {
      const ih = innerHtmlRef.current.offsetHeight;
      if (ih > 0) setExpandedHeight(ih);
    } else if (contentRef.current) {
      const ch = contentRef.current.scrollHeight;
      if (ch > 0) setExpandedHeight(ch);
    }
  }, []);

  useLayoutEffect(() => {
    measureHeights();

    const ro = new ResizeObserver(() => {
      measureHeights();
    });

    if (restingCardRef.current) ro.observe(restingCardRef.current);
    if (restingTextRef.current) ro.observe(restingTextRef.current);
    if (innerHtmlRef.current) ro.observe(innerHtmlRef.current);
    else if (contentRef.current) ro.observe(contentRef.current);

    return () => ro.disconnect();
  }, [cleanText, fullNotes, isLoadingDetails, measureHeights]);

  useEffect(() => {
    if (isExpanded) {
      measureHeights();
    }
  }, [isExpanded, measureHeights]);

  useEffect(() => {
    onExpandedChange?.(isExpanded);
  }, [isExpanded, onExpandedChange]);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 120);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Click-outside listener when locked
  useEffect(() => {
    if (!isLocked) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsLocked(false);
        setIsHovered(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLocked]);

  const targetExpandedHeight = Math.max(
    restingTextHeight,
    Math.min(expandedHeight ?? restingTextHeight, 280)
  );

  const currentHeight = isExpanded ? targetExpandedHeight : restingTextHeight;

  return (
    <Box
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        position: 'relative',
        mb: 1.5,
      }}
    >
      {/* Resting preview card */}
      <Paper
        ref={restingCardRef}
        variant="outlined"
        onClick={() => setIsLocked((prev) => !prev)}
        sx={{
          p: 1.25,
          borderRadius: 2,
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
          cursor: 'pointer',
          transition: 'background-color 0.15s ease',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 28, mb: 0.75 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <NotesIcon color="primary" sx={{ fontSize: '1rem' }} />
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                fontSize: '0.825rem',
                color: 'text.primary',
                lineHeight: 1.2,
              }}
            >
              {t('lblProjectNotes')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title={isLocked ? t('unpinNotesPreview') : t('pinNotesPreview')}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLocked(!isLocked);
                }}
                color={isLocked ? 'primary' : 'default'}
                sx={{
                  p: 0.5,
                  bgcolor: isLocked ? 'action.selected' : 'transparent',
                }}
              >
                {isLocked ? (
                  <PushPinIcon sx={{ fontSize: '0.95rem' }} />
                ) : (
                  <PushPinOutlinedIcon sx={{ fontSize: '0.95rem', transform: 'rotate(45deg)' }} />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title={t('btnView')}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenModal();
                }}
                sx={{ p: 0.5 }}
              >
                <OpenInNewIcon sx={{ fontSize: '0.95rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Typography
          ref={restingTextRef}
          variant="body2"
          component="div"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: '0.8125rem',
            lineHeight: 1.5,
            color: 'text.primary',
            m: 0,
          }}
        >
          {cleanText || t('viewProjectNotes')}
        </Typography>
      </Paper>

      {/* Floating Expanded Overlay with Click-to-Lock */}
      <Paper
        elevation={isExpanded ? 8 : 0}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          minHeight: previewCardHeight ?? undefined,
          p: 1.25,
          borderRadius: 2,
          bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#132018' : '#ffffff'),
          border: '1px solid',
          borderColor: isLocked ? 'primary.main' : 'divider',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? isExpanded
                ? '0 12px 32px rgba(0,0,0,0.75), 0 2px 6px rgba(0,0,0,0.5)'
                : 'none'
              : isExpanded
              ? '0 12px 32px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.06)'
              : 'none',
          opacity: isExpanded ? 1 : 0,
          visibility: isExpanded ? 'visible' : 'hidden',
          pointerEvents: isExpanded ? 'auto' : 'none',
          transition: isExpanded
            ? 'opacity 0.12s ease-out, visibility 0.12s ease-out, box-shadow 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
            : 'opacity 0.18s cubic-bezier(0.25, 1, 0.5, 1), visibility 0.18s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.2s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
      >
        {/* Hidden Chip to ensure MUI Emotion injects Chip styles on initial render */}
        <Chip size="small" color="error" sx={{ display: 'none' }} />

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 28, mb: 0.75 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <NotesIcon color="primary" sx={{ fontSize: '1rem' }} />
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                fontSize: '0.825rem',
                color: 'text.primary',
                lineHeight: 1.2,
              }}
            >
              {t('lblProjectNotes')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title={isLocked ? t('unpinNotesPreview') : t('pinNotesPreview')}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLocked(!isLocked);
                }}
                color={isLocked ? 'primary' : 'default'}
                sx={{
                  p: 0.5,
                  bgcolor: isLocked ? 'action.selected' : 'transparent',
                }}
              >
                {isLocked ? (
                  <PushPinIcon sx={{ fontSize: '0.95rem' }} />
                ) : (
                  <PushPinOutlinedIcon sx={{ fontSize: '0.95rem', transform: 'rotate(45deg)' }} />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title={t('btnView')}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenModal();
                }}
                sx={{ p: 0.5 }}
              >
                <OpenInNewIcon sx={{ fontSize: '0.95rem' }} />
              </IconButton>
            </Tooltip>
            {isLocked && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLocked(false);
                  setIsHovered(false);
                }}
                sx={{ p: 0.5 }}
              >
                <CloseIcon sx={{ fontSize: '0.95rem' }} />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Scrollable Rich Content Body with True-Height Transition */}
        <Box
          sx={{
            height: currentHeight,
            overflow: 'hidden',
            transition: isExpanded
              ? 'height 0.35s cubic-bezier(0.25, 1, 0.5, 1)'
              : 'height 0.22s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          <Box
            ref={contentRef}
            sx={{
              maxHeight: 280,
              overflowY: isExpanded && targetExpandedHeight >= 280 ? 'auto' : 'hidden',
              pr: 0.75,
              fontSize: '0.8125rem',
              lineHeight: 1.5,
              color: 'text.primary',
              scrollbarWidth: 'thin',
              scrollbarColor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.28) transparent'
                  : 'rgba(0, 0, 0, 0.28) transparent',
              '&::-webkit-scrollbar': {
                width: '6px',
                display: 'block',
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.28)' : 'rgba(0, 0, 0, 0.28)',
                borderRadius: '3px',
                '&:hover': {
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)',
                },
              },
              '& p': { m: 0, mb: 0.75 },
              '& p:last-child': { mb: 0 },
              '& ul, & ol': { m: 0, pl: 2.2, mb: 0.75 },
              '& li': { mb: 0.25 },
              '& blockquote': {
                m: 0,
                pl: 1.25,
                borderLeft: '3px solid',
                borderColor: 'primary.main',
                color: 'text.secondary',
                fontStyle: 'italic',
                mb: 0.75,
              },
              '& a': { color: 'primary.main', textDecoration: 'underline' },
              '& .mention-tag': {
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.18)' : 'rgba(25, 118, 210, 0.12)',
                color: (theme) => (theme.palette.mode === 'dark' ? '#90caf9' : 'primary.main'),
                border: '1px solid',
                borderColor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.35)' : 'rgba(25, 118, 210, 0.25)',
                borderRadius: '4px',
                px: 0.6,
                py: 0.1,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                margin: '0 2px',
                fontSize: '0.75rem',
              },
              // Direct styling support for pasted MUI Chips and badges (e.g. reminders)
              '& .MuiChip-root': {
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '16px',
                whiteSpace: 'nowrap',
                verticalAlign: 'middle',
                fontSize: '0.72rem',
                fontWeight: 700,
                height: '20px',
                px: 0.5,
                maxWidth: '100%',
                boxSizing: 'border-box',
              },
              '& .MuiChip-sizeSmall': {
                height: '18px',
                fontSize: '0.65rem',
              },
              '& .MuiChip-colorError': {
                bgcolor: 'error.main',
                color: '#ffffff',
              },
              '& .MuiChip-colorWarning': {
                bgcolor: 'warning.main',
                color: '#ffffff',
              },
              '& .MuiChip-colorSuccess': {
                bgcolor: 'success.main',
                color: '#ffffff',
              },
              '& .MuiChip-colorInfo': {
                bgcolor: 'info.main',
                color: '#ffffff',
              },
              '& .MuiChip-colorDefault': {
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                color: 'inherit',
              },
              '& .MuiChip-label': {
                paddingLeft: '6px',
                paddingRight: '6px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              },
              '& .MuiBox-root:has(> .MuiChip-root)': {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                my: 0.5,
              },
              '& .MuiTypography-root': {
                margin: 0,
              },
            }}
          >
            {isLoadingDetails && !fullNotes ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: restingTextHeight,
                  color: 'text.secondary',
                }}
              >
                <CircularProgress size={18} />
              </Box>
            ) : (
              <Box
                ref={innerHtmlRef}
                dangerouslySetInnerHTML={{ __html: fullNotes || '' }}
              />
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};
