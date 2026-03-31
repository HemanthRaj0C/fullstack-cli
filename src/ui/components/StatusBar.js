import React, { useState, useEffect } from 'react';
import { Box, Text, useStdout } from 'ink';
import { colors } from '../theme.js';

/**
 * StatusBar - Bottom status bar with system info and navigation hints
 */
export function StatusBar({
  mode = 'default', // 'default', 'selection', 'running', 'complete', 'error'
  currentPage = null,
  totalPages = null,
}) {
  const { stdout } = useStdout();
  const termWidth = stdout?.columns || 80;
  const [memUsed, setMemUsed] = useState(24);

  // Simulate memory updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMemUsed(Math.floor(20 + Math.random() * 30));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Get status indicator
  const getStatus = () => {
    switch (mode) {
      case 'selection':
        return { color: colors.secondary, text: 'AWAITING INPUT' };
      case 'running':
        return { color: colors.warning, text: 'PROCESSING...' };
      case 'complete':
        return { color: colors.success, text: 'COMPLETE' };
      case 'error':
        return { color: colors.error, text: 'ERROR' };
      default:
        return { color: colors.muted, text: 'READY' };
    }
  };

  const status = getStatus();

  // Navigation hints
  const getNavHints = () => {
    if (mode === 'selection') {
      return React.createElement(
        Box,
        { flexDirection: 'row', gap: 2 },
        React.createElement(
          Box,
          { flexDirection: 'row', gap: 1 },
          React.createElement(Text, { color: colors.secondary, inverse: true }, ' ↑↓ '),
          React.createElement(Text, { color: colors.muted }, 'Navigate')
        ),
        React.createElement(
          Box,
          { flexDirection: 'row', gap: 1 },
          React.createElement(Text, { color: colors.secondary, inverse: true }, ' ⏎ '),
          React.createElement(Text, { color: colors.muted }, 'Select')
        ),
        React.createElement(
          Box,
          { flexDirection: 'row', gap: 1 },
          React.createElement(Text, { color: colors.secondary, inverse: true }, ' ESC '),
          React.createElement(Text, { color: colors.muted }, 'Quit')
        )
      );
    }
    if (mode === 'complete' || mode === 'error') {
      return React.createElement(
        Box,
        { flexDirection: 'row', gap: 1 },
        React.createElement(Text, { color: colors.muted, inverse: true }, ' CTRL+C '),
        React.createElement(Text, { color: colors.muted }, 'Exit')
      );
    }
    return null;
  };

  return React.createElement(
    Box,
    {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: termWidth,
      paddingX: 1,
      borderStyle: 'single',
      borderColor: colors.muted,
      borderTop: true,
      borderBottom: false,
      borderLeft: false,
      borderRight: false,
    },
    // Left: Memory
    React.createElement(
      Box,
      { flexDirection: 'row', gap: 1 },
      React.createElement(Text, { color: colors.success }, '●'),
      React.createElement(Text, { color: colors.muted }, `MEM: ${memUsed}MB/128MB`)
    ),
    // Center: Nav hints
    getNavHints(),
    // Right: Page + Status
    React.createElement(
      Box,
      { flexDirection: 'row', gap: 2 },
      currentPage !== null && totalPages !== null && React.createElement(
        Text,
        { color: colors.muted },
        `${currentPage}/${totalPages}`
      ),
      React.createElement(Text, { color: status.color }, status.text)
    )
  );
}

/**
 * SystemInfo - Display system info bar
 */
export function SystemInfo() {
  const { stdout } = useStdout();
  const termWidth = stdout?.columns || 80;
  
  return React.createElement(
    Box,
    {
      flexDirection: 'row',
      justifyContent: 'center',
      width: termWidth,
      gap: 2,
      paddingY: 1,
    },
    React.createElement(Text, { color: colors.muted }, 'SYSTEM UPTIME: 99.99%'),
    React.createElement(Text, { color: colors.muted }, '|'),
    React.createElement(Text, { color: colors.muted }, 'MEMORY: OK'),
    React.createElement(Text, { color: colors.muted }, '|'),
    React.createElement(Text, { color: colors.muted }, `TERMINAL: ${process.env.TERM || 'xterm-256color'}`)
  );
}
