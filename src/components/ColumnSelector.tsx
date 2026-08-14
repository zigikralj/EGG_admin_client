import React, { useState } from 'react';
import {
  Button,
  Popover,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Divider,
} from '@mui/material';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import { useLanguage } from '../context/LanguageContext';

export interface ColumnDef {
  id: string;
  label: string;
}

interface Props {
  columns: ColumnDef[];
  visibleColumns: string[];
  onChange: (visible: string[]) => void;
}

export const ColumnSelector: React.FC<Props> = ({
  columns,
  visibleColumns,
  onChange,
}) => {
  const { t } = useLanguage();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const toggleColumn = (id: string) => {
    if (visibleColumns.includes(id)) {
      if (visibleColumns.length <= 1) return; // Keep at least one column
      onChange(visibleColumns.filter((c) => c !== id));
    } else {
      onChange([...visibleColumns, id]);
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? 'column-selector-popover' : undefined;

  return (
    <>
      <Button
        aria-describedby={id}
        variant="outlined"
        size="small"
        startIcon={<ViewColumnIcon />}
        onClick={handleClick}
        color="primary"
        sx={{ borderRadius: 2 }}
      >
        {t('btnCustomizeColumns')}
      </Button>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: { sx: { width: 240, p: 1.5 } },
        }}
      >
        <Typography variant="overline" color="text.secondary" sx={{ px: 1, pb: 0.5, display: 'block', fontWeight: 700 }}>
          {t('lblSelectColumns')}
        </Typography>
        <Divider sx={{ mb: 1 }} />
        <FormGroup sx={{ px: 1 }}>
          {columns.map((col) => {
            const isChecked = visibleColumns.includes(col.id);
            return (
              <FormControlLabel
                key={col.id}
                control={
                  <Checkbox
                    size="small"
                    checked={isChecked}
                    onChange={() => toggleColumn(col.id)}
                    color="primary"
                  />
                }
                label={<Typography variant="body2">{col.label}</Typography>}
              />
            );
          })}
        </FormGroup>
      </Popover>
    </>
  );
};
