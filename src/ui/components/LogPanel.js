import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme.js';

/**
 * LogPanel - Clean log output panel
 */
export function LogPanel({ 
  logs, 
  maxHeight = 10, 
  phase = null, 
  noBorder = false, 
  title = null,
}) {
  const filteredLogs = useMemo(() => {
    if (!phase) return logs;
    return logs.filter(log => log.phase === phase);
  }, [logs, phase]);

  const visibleLogs = useMemo(() => {
    return filteredLogs.slice(-maxHeight);
  }, [filteredLogs, maxHeight]);

  const getPhaseLabel = () => {
    if (title) return title;
    switch (phase) {
      case 'frontend': return 'Frontend';
      case 'backend': return 'Backend';
      default: return 'Output';
    }
  };

  const getColorForType = (type) => {
    switch (type) {
      case 'error': return colors.error;
      case 'success': return colors.success;
      case 'warning': return colors.warning;
      default: return colors.text;
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'error': return '✗';
      case 'success': return '✓';
      case 'warning': return '!';
      default: return '▸';
    }
  };

  // Title
  const titleElement = React.createElement(
    Box,
    { marginBottom: 1 },
    React.createElement(
      Text,
      { color: colors.secondary, bold: true },
      getPhaseLabel()
    ),
    React.createElement(
      Text,
      { color: colors.muted, marginLeft: 1 },
      `(${filteredLogs.length})`
    )
  );

  // Empty state
  if (filteredLogs.length === 0) {
    return React.createElement(
      Box,
      {
        flexDirection: 'column',
        borderStyle: noBorder ? undefined : 'single',
        borderColor: colors.muted,
        paddingX: noBorder ? 0 : 1,
        paddingY: noBorder ? 0 : 1,
      },
      titleElement,
      React.createElement(Text, { color: colors.muted, dimColor: true }, 'Waiting...')
    );
  }

  // Render log entries
  const logElements = visibleLogs.map((log, idx) => {
    const icon = getIconForType(log.type);
    const color = getColorForType(log.type);
    
    return React.createElement(
      Box,
      { key: idx, flexDirection: 'row' },
      React.createElement(Text, { color }, `${icon} `),
      React.createElement(Text, { color, wrap: 'truncate' }, log.message)
    );
  });

  // "More lines" indicator
  const moreIndicator = filteredLogs.length > maxHeight
    ? React.createElement(
        Text, 
        { color: colors.muted, dimColor: true }, 
        `  ... ${filteredLogs.length - maxHeight} more`
      )
    : null;

  return React.createElement(
    Box,
    {
      flexDirection: 'column',
      borderStyle: noBorder ? undefined : 'single',
      borderColor: colors.primary,
      paddingX: noBorder ? 0 : 1,
      paddingY: noBorder ? 0 : 1,
    },
    titleElement,
    React.createElement(
      Box,
      { flexDirection: 'column' },
      logElements
    ),
    moreIndicator
  );
}
