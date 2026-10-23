import React, { useState } from 'react';
import { Box, Chip, Tooltip } from '@mui/material';

export interface ExpandableChipItem {
  code: string;
  description?: string | null;
  hazardListMark?: string | null;
  [key: string]: any;
}

export interface ExpandableChipListProps {
  items?: ExpandableChipItem[];
  wcs?: ExpandableChipItem[]; // backward-compatible alias
  max?: number;
}

export const ExpandableChipList: React.FC<ExpandableChipListProps> = ({
  items,
  wcs,
  max = 2,
}) => {
  const chipItems = items || wcs || [];
  const [expanded, setExpanded] = useState(false);

  if (chipItems.length <= max) {
    return (
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {chipItems.map((item, i) => (
          <Tooltip
            key={i}
            title={`${item.code} - ${item.description || ''}${item.hazardListMark ? ` (${item.hazardListMark})` : ''}`}
          >
            <Chip
              label={item.code}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600, height: 20, fontSize: '0.7rem' }}
            />
          </Tooltip>
        ))}
      </Box>
    );
  }

  const visibleItems = expanded ? chipItems : chipItems.slice(0, max);

  return (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
      {visibleItems.map((item, i) => (
        <Tooltip
          key={i}
          title={`${item.code} - ${item.description || ''}${item.hazardListMark ? ` (${item.hazardListMark})` : ''}`}
        >
          <Chip
            label={item.code}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600, height: 20, fontSize: '0.7rem' }}
          />
        </Tooltip>
      ))}
      <Chip
        label={expanded ? '−' : `+${chipItems.length - max}`}
        size="small"
        color="default"
        variant="filled"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem', cursor: 'pointer', minWidth: 24 }}
      />
    </Box>
  );
};
