import React from 'react';
import { Box, Text } from 'ink';
import { normalizeStackSelection } from '../../utils/stack.js';

export function PreviewPanel({ selections }) {
  const isComplete = selections.frontend && selections.backend && selections.database;

  if (!isComplete) {
    return React.createElement(
      Box,
      { flexDirection: 'column', borderStyle: 'single', borderColor: 'gray', padding: 1, width: 50 },
      React.createElement(Text, { bold: true, color: 'yellow' }, 'Stack Preview'),
      React.createElement(Text, { dimColor: true }, 'Selections will appear here...')
    );
  }

  const normalized = normalizeStackSelection(selections);
  const jsonStr = JSON.stringify(normalized, null, 2);
  const jsonLines = jsonStr.split('\n').map((line, idx) =>
    React.createElement(Text, { key: idx, color: 'white' }, line)
  );

  const warnings =
    normalized.warnings && normalized.warnings.length > 0
      ? React.createElement(
          Box,
          { flexDirection: 'column', marginTop: 1 },
          React.createElement(Text, { bold: true, color: 'yellow' }, 'Warnings:'),
          ...normalized.warnings.map((warn, idx) =>
            React.createElement(Text, { key: idx, color: 'yellow', dimColor: true }, `• ${warn}`)
          )
        )
      : null;

  return React.createElement(
    Box,
    { flexDirection: 'column', borderStyle: 'single', borderColor: 'green', padding: 1, width: 50 },
    React.createElement(Text, { bold: true, color: 'green' }, 'Stack Preview'),
    jsonLines,
    warnings
  );
}
