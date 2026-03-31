import React from 'react';
import { Box, Text } from 'ink';
import { normalizeStackSelection } from '../../utils/stack.js';
import { colors } from '../theme.js';

/**
 * PreviewPanel - Shows selected stack preview
 */
export function PreviewPanel({ selections }) {
  const hasAnySelection = selections.frontend || selections.backend || selections.database;

  // Title
  const title = React.createElement(
    Box,
    { marginBottom: 1 },
    React.createElement(
      Text,
      { color: colors.secondary, bold: true },
      'Preview'
    )
  );

  // Empty state
  if (!hasAnySelection) {
    return React.createElement(
      Box,
      { flexDirection: 'column' },
      title,
      React.createElement(
        Text,
        { color: colors.muted },
        'Select options to see preview...'
      )
    );
  }

  // Show current selections
  const selectionsList = React.createElement(
    Box,
    { flexDirection: 'column', gap: 0 },
    selections.frontend && React.createElement(
      Box,
      { flexDirection: 'row', gap: 1 },
      React.createElement(Text, { color: colors.muted }, 'Frontend:'),
      React.createElement(Text, { color: colors.primary, bold: true }, selections.frontend)
    ),
    selections.backend && React.createElement(
      Box,
      { flexDirection: 'row', gap: 1 },
      React.createElement(Text, { color: colors.muted }, 'Backend:'),
      React.createElement(Text, { color: colors.primary, bold: true }, selections.backend)
    ),
    selections.database && React.createElement(
      Box,
      { flexDirection: 'row', gap: 1 },
      React.createElement(Text, { color: colors.muted }, 'Database:'),
      React.createElement(Text, { color: colors.primary, bold: true }, selections.database)
    )
  );

  // Generate simple package.json preview
  const packagePreview = React.createElement(
    Box,
    { flexDirection: 'column', marginTop: 2 },
    React.createElement(Text, { color: colors.muted, dimColor: true }, '// package.json'),
    React.createElement(Text, { color: colors.text }, '{'),
    React.createElement(Text, { color: colors.text }, '  "name": "my-app",'),
    React.createElement(Text, { color: colors.text }, '  "version": "0.1.0",'),
    selections.frontend && React.createElement(
      Text, 
      { color: colors.text }, 
      `  "framework": "${selections.frontend}",`
    ),
    React.createElement(Text, { color: colors.text }, '  ...'),
    React.createElement(Text, { color: colors.text }, '}')
  );

  return React.createElement(
    Box,
    { flexDirection: 'column' },
    title,
    selectionsList,
    packagePreview
  );
}
