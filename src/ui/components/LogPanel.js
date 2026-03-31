import React, { useMemo } from 'react';
import { Box, Text } from 'ink';

export function LogPanel({ logs, maxHeight = 10, phase = null }) {
  const filteredLogs = useMemo(() => {
    if (!phase) return logs;
    return logs.filter(log => log.phase === phase);
  }, [logs, phase]);

  const visibleLogs = useMemo(() => {
    return filteredLogs.slice(-maxHeight);
  }, [filteredLogs, maxHeight]);

  const getPhaseLabel = () => {
    switch (phase) {
      case 'frontend':
        return 'Frontend Logs';
      case 'backend':
        return 'Backend Logs';
      default:
        return 'Output Logs';
    }
  };

  if (filteredLogs.length === 0) {
    return React.createElement(
      Box,
      { flexDirection: 'column', borderStyle: 'single', borderColor: 'cyan', padding: 1 },
      React.createElement(Text, { bold: true, color: 'cyan' }, getPhaseLabel()),
      React.createElement(Text, { dimColor: true }, 'Waiting for output...')
    );
  }

  const getColorForType = (type) => {
    switch (type) {
      case 'error':
        return 'red';
      case 'success':
        return 'green';
      case 'warning':
        return 'yellow';
      case 'info':
      default:
        return 'white';
    }
  };

  const logElements = visibleLogs.map((log, idx) =>
    React.createElement(
      Text, 
      { key: idx, color: getColorForType(log.type) }, 
      `  ${log.message}`
    )
  );

  const moreLogsText =
    filteredLogs.length > maxHeight
      ? React.createElement(Text, { dimColor: true, marginTop: 0 }, `… and ${filteredLogs.length - maxHeight} more lines`)
      : null;

  return React.createElement(
    Box,
    {
      flexDirection: 'column',
      borderStyle: 'single',
      borderColor: 'cyan',
      padding: 1,
    },
    React.createElement(Text, { bold: true, color: 'cyan' }, `${getPhaseLabel()} (${filteredLogs.length} total)`),
    React.createElement(Box, { flexDirection: 'column', marginTop: 1 }, logElements),
    moreLogsText
  );
}
