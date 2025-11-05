"use client";
import { IconButton, Tooltip } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // naive detection based on body data-theme maybe; we just flip state optimistically
  }, []);

  const handleToggle = () => {
    setIsDark((v) => !v);
    if (typeof window !== 'undefined' && (window as any).__toggle_theme) {
      (window as any).__toggle_theme();
    }
  };

  return (
    <Tooltip title="Toggle theme">
      <IconButton onClick={handleToggle} aria-label="Toggle theme">
        {isDark ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
}


