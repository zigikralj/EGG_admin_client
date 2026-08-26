import React, { useState, useEffect } from 'react';
import { Box, Typography, Slider } from '@mui/material';

const getProgressColor = (val: number) => {
  const clamped = Math.max(0, Math.min(100, Number(val) || 0));
  const hue = Math.round((clamped / 100) * 125);
  return `hsl(${hue}, 80%, 42%)`;
};

interface ProjectProgressSliderProps {
  value: number;
  label: string;
  disabled?: boolean;
  onChangeCommitted: (val: number) => void;
}

export const ProjectProgressSlider: React.FC<ProjectProgressSliderProps> = React.memo(({
  value,
  label,
  disabled = false,
  onChangeCommitted,
}) => {
  const [localVal, setLocalVal] = useState(value);
  const [colorVal, setColorVal] = useState(value);

  useEffect(() => {
    setLocalVal(value);
    setColorVal(value);
  }, [value]);

  const progressColor = getProgressColor(colorVal);

  return (
    <Box sx={{ px: 1, pt: 0.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: 'text.secondary',
          }}
        >
          {label} ({localVal}%)
        </Typography>
      </Box>
      <Slider
        value={localVal}
        min={0}
        max={100}
        step={1}
        disabled={disabled}
        valueLabelDisplay="auto"
        valueLabelFormat={(val) => `${val}%`}
        onChange={(_, val) => {
          const num = Array.isArray(val) ? val[0] : val;
          setLocalVal(num);
        }}
        onChangeCommitted={(_, val) => {
          const num = Array.isArray(val) ? val[0] : val;
          setLocalVal(num);
          setColorVal(num);
          onChangeCommitted(num);
        }}
        sx={{
          width: '100%',
          color: progressColor,
          py: 0.75,
          '& .MuiSlider-rail': {
            opacity: 0.25,
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
            height: 5,
            borderRadius: 2.5,
          },
          '& .MuiSlider-track': {
            backgroundColor: progressColor,
            borderColor: progressColor,
            height: 5,
            borderRadius: 2.5,
            transition: 'none',
          },
          '& .MuiSlider-thumb': {
            width: 16,
            height: 16,
            backgroundColor: progressColor,
            boxShadow: `0 0 0 3px ${progressColor}26`,
            transition: 'none',
            '&:hover, &.Mui-focusVisible': {
              boxShadow: `0 0 0 6px ${progressColor}33`,
            },
            '&.Mui-active': {
              boxShadow: `0 0 0 8px ${progressColor}44`,
            },
          },
          '& .MuiSlider-valueLabel': {
            backgroundColor: progressColor,
            fontWeight: 700,
            borderRadius: 1,
            fontSize: '0.75rem',
          },
        }}
      />
    </Box>
  );
});
