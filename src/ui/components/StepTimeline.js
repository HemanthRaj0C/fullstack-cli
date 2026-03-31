import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme.js';

/**
 * StepTimeline - Clean vertical step indicator
 */
export function StepTimeline({ steps, noBorder = false }) {
  const stepOrder = ['preflight', 'frontend', 'backend', 'backendStatus'];
  const stepLabels = {
    preflight: 'Prerequisites',
    frontend: 'Frontend',
    backend: 'Backend',
    backendStatus: 'Configuration',
  };

  const getIcon = (status) => {
    switch (status) {
      case 'done': return '✓';
      case 'running': return '→';
      case 'failed': return '✗';
      default: return '○';
    }
  };

  const getColor = (status) => {
    switch (status) {
      case 'done': return colors.success;
      case 'running': return colors.warning;
      case 'failed': return colors.error;
      default: return colors.muted;
    }
  };

  const stepElements = stepOrder.map((stepName, idx) => {
    const status = steps[stepName] || 'pending';
    const label = stepLabels[stepName];
    const isLast = idx === stepOrder.length - 1;
    const icon = getIcon(status);
    const color = getColor(status);

    return React.createElement(
      Box,
      { key: stepName, flexDirection: 'column' },
      React.createElement(
        Box,
        { flexDirection: 'row', gap: 2 },
        React.createElement(Text, { color, bold: status === 'running' }, icon),
        React.createElement(
          Text,
          { color, bold: status === 'running' },
          label
        )
      ),
      !isLast && React.createElement(
        Box,
        { marginLeft: 1 },
        React.createElement(Text, { color: colors.muted }, '│')
      )
    );
  });

  return React.createElement(
    Box,
    {
      flexDirection: 'column',
      borderStyle: noBorder ? undefined : 'single',
      borderColor: colors.secondary,
      paddingX: noBorder ? 0 : 2,
      paddingY: noBorder ? 0 : 1,
    },
    React.createElement(
      Text,
      { color: colors.secondary, bold: true, marginBottom: 1 },
      'Steps'
    ),
    ...stepElements
  );
}
