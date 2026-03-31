#!/usr/bin/env node

import React, { useState, useEffect } from 'react';
import { render, Box, Text } from 'ink';
import { ProgressBar } from './src/ui/components/ProgressBar.js';

function TestProgressBar() {
  const [steps, setSteps] = useState({
    preflight: 'done',
    frontend: 'running',
    backend: 'pending',
    backendStatus: 'pending',
  });

  // Simulate progress for demo
  useEffect(() => {
    const sequence = [
      { preflight: 'done', frontend: 'running', backend: 'pending', backendStatus: 'pending' },
      { preflight: 'done', frontend: 'done', backend: 'running', backendStatus: 'pending' },
      { preflight: 'done', frontend: 'done', backend: 'done', backendStatus: 'running' },
      { preflight: 'done', frontend: 'done', backend: 'done', backendStatus: 'done' },
    ];

    let idx = 0;
    const interval = setInterval(() => {
      if (idx < sequence.length) {
        setSteps(sequence[idx]);
        idx++;
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return React.createElement(
    Box,
    { flexDirection: 'column', padding: 1, width: 100 },
    React.createElement(
      Text,
      { bold: true, color: 'cyan', marginBottom: 1 },
      'Enhanced Progress Bar Preview'
    ),
    React.createElement(ProgressBar, { steps }),
    React.createElement(
      Text,
      { dimColor: true, marginTop: 2 },
      'Watch the progress bar update as each step completes (Every 3 seconds)'
    )
  );
}

const { unmount } = render(React.createElement(TestProgressBar));

// Exit after 15 seconds
setTimeout(() => {
  unmount();
  process.exit(0);
}, 15000);
