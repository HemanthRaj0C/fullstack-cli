import React from 'react';
import { Box } from 'ink';
import { SelectScreen } from './SelectScreen.js';
import { PreviewPanel } from './PreviewPanel.js';
import { LogPanel } from './LogPanel.js';
import { StepTimeline } from './StepTimeline.js';
import { ProgressBar } from './ProgressBar.js';

export function LayoutWrapper({ mode = 'selection', selections = {}, logs = [], steps = {} }) {
  // Selection mode: Show SelectScreen on left, PreviewPanel on right
  if (mode === 'selection') {
    return React.createElement(
      Box,
      { flexDirection: 'row', gap: 2, padding: 1 },
      React.createElement(
        Box,
        { flexDirection: 'column', width: '50%' },
        React.createElement(SelectScreen, { onComplete: () => {}, onCancel: () => {} })
      ),
      React.createElement(
        Box,
        { flexDirection: 'column' },
        React.createElement(PreviewPanel, { selections })
      )
    );
  }

  // Run mode: Show StepTimeline and LogPanel stacked
  if (mode === 'run') {
    return React.createElement(
      Box,
      { flexDirection: 'column', gap: 1, padding: 1 },
      // Progress bar at top (full width)
      React.createElement(
        ProgressBar,
        { steps }
      ),
      // Timeline and logs below
      React.createElement(
        Box,
        { flexDirection: 'row', gap: 2, marginTop: 1 },
        React.createElement(
          Box,
          { flexDirection: 'column', width: '50%' },
          React.createElement(StepTimeline, { steps })
        )
      ),
      // Split logs into frontend and backend
      React.createElement(
        Box,
        { flexDirection: 'row', gap: 2, marginTop: 1 },
        React.createElement(
          Box,
          { flexDirection: 'column', width: '50%' },
          React.createElement(LogPanel, { logs, phase: 'frontend', maxHeight: 8 })
        ),
        React.createElement(
          Box,
          { flexDirection: 'column', width: '50%' },
          React.createElement(LogPanel, { logs, phase: 'backend', maxHeight: 8 })
        )
      )
    );
  }

  return null;
}
