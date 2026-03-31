import React from 'react';
import { Box, Text } from 'ink';

const StatusIcon = ({ status }) => {
  switch (status) {
    case 'pending':
      return React.createElement(Text, { color: 'gray' }, '⋯');
    case 'running':
      return React.createElement(Text, { color: 'yellow' }, '◐');
    case 'done':
      return React.createElement(Text, { color: 'green' }, '✓');
    case 'failed':
      return React.createElement(Text, { color: 'red' }, '✗');
    default:
      return React.createElement(Text, null, '?');
  }
};

const StatusLabel = ({ status }) => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'running':
      return 'Running';
    case 'done':
      return 'Done';
    case 'failed':
      return 'Failed';
    default:
      return 'Unknown';
  }
};

export function StepTimeline({ steps, noBorder = false }) {
  const stepOrder = ['preflight', 'frontend', 'backend', 'backendStatus'];
  const stepLabels = {
    preflight: 'Check Prerequisites',
    frontend: 'Frontend Setup',
    backend: 'Backend Setup',
    backendStatus: 'Backend Status Component',
  };

  const stepElements = stepOrder.map((stepName) => {
    const status = steps[stepName] || 'pending';
    const label = stepLabels[stepName];
    const color =
      status === 'done'
        ? 'green'
        : status === 'failed'
          ? 'red'
          : status === 'running'
            ? 'yellow'
            : 'gray';

    return React.createElement(
      Box,
      { key: stepName, marginBottom: 0 },
      React.createElement(Box, { width: 3 }, React.createElement(StatusIcon, { status })),
      React.createElement(Text, { color, bold: status === 'running' }, label),
      React.createElement(
        Box,
        { marginLeft: 'auto' },
        React.createElement(Text, { dimColor: true, color }, `(${StatusLabel({ status })})`)
      )
    );
  });

  return React.createElement(
    Box,
    {
      flexDirection: 'column',
      borderStyle: noBorder ? undefined : 'single',
      borderColor: 'cyan',
      padding: noBorder ? 0 : 1
    },
    React.createElement(Text, { bold: true, color: 'cyan' }, 'Progress Timeline'),
    React.createElement(Box, { flexDirection: 'column', marginTop: 1, gap: 0 }, stepElements)
  );
}
