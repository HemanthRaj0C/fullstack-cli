#!/usr/bin/env node

import React, { useState } from 'react';
import { render, Box, Text } from 'ink';
import { ProgressBar } from './src/ui/components/ProgressBar.js';
import { StepTimeline } from './src/ui/components/StepTimeline.js';
import { LogPanel } from './src/ui/components/LogPanel.js';

function LayoutDemo() {
  const [steps] = useState({
    preflight: 'done',
    frontend: 'running',
    backend: 'pending',
    backendStatus: 'pending',
  });

  const sampleLogs = [
    { message: '→ Checking prerequisites...', type: 'info', phase: 'frontend', timestamp: Date.now() },
    { message: '✓ All prerequisites available', type: 'success', phase: 'frontend', timestamp: Date.now() },
    { message: '→ Setting up React + Vite...', type: 'info', phase: 'frontend', timestamp: Date.now() },
    { message: 'Resolving dependencies...', type: 'info', phase: 'frontend', timestamp: Date.now() },
    { message: 'Running create-vite...', type: 'info', phase: 'frontend', timestamp: Date.now() },
    { message: 'Dependency scaffold complete', type: 'success', phase: 'frontend', timestamp: Date.now() },
    { message: 'Installing npm dependencies...', type: 'info', phase: 'frontend', timestamp: Date.now() },
    { message: 'Backend template cloning...', type: 'info', phase: 'backend', timestamp: Date.now() },
  ];

  const frontendLogs = sampleLogs.filter(l => l.phase === 'frontend');
  const backendLogs = sampleLogs.filter(l => l.phase === 'backend');

  return React.createElement(
    Box,
    { flexDirection: 'column', gap: 1, padding: 1, width: '100%' },
    // Title
    React.createElement(
      Box,
      { marginBottom: 1 },
      React.createElement(
        Text,
        { color: 'cyan', bold: true },
        '⚙️  Full-Stack CLI Generator'
      )
    ),
    // Progress bar at top (full width)
    React.createElement(ProgressBar, { steps }),
    
    // Timeline and logs below
    React.createElement(
      Box,
      { flexDirection: 'row', gap: 2, marginTop: 1 },
      React.createElement(
        Box,
        { flexDirection: 'column', width: '40%' },
        React.createElement(StepTimeline, { steps })
      ),
      // Spacer
      React.createElement(
        Box,
        { flexDirection: 'column', width: '60%', gap: 1 },
        React.createElement(
          Text,
          { dimColor: true, fontSize: 'small' },
          '[Split logs view - Frontend left | Backend right]'
        )
      )
    ),
    
    // Split logs into frontend and backend
    React.createElement(
      Box,
      { flexDirection: 'row', gap: 2, marginTop: 1 },
      React.createElement(
        Box,
        { flexDirection: 'column', width: '50%' },
        React.createElement(LogPanel, { logs: frontendLogs, phase: 'frontend', maxHeight: 6 })
      ),
      React.createElement(
        Box,
        { flexDirection: 'column', width: '50%' },
        React.createElement(LogPanel, { logs: backendLogs, phase: 'backend', maxHeight: 6 })
      )
    ),
    
    // Footer
    React.createElement(
      Box,
      { marginTop: 1 },
      React.createElement(
        Text,
        { color: 'yellow' },
        '⟳ Processing...'
      )
    )
  );
}

const { unmount } = render(React.createElement(LayoutDemo));

// Exit after 8 seconds
setTimeout(() => {
  unmount();
  process.exit(0);
}, 8000);
