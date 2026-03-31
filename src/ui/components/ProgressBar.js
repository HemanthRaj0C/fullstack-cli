import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme.js';

/**
 * ProgressBar - Clean progress bar display
 */
export function ProgressBar({ steps = {}, showTimer = true }) {
  const [elapsed, setElapsed] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(e => e + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const stepLabels = {
    preflight: 'Prerequisites',
    frontend: 'Frontend',
    backend: 'Backend',
    backendStatus: 'Config',
  };

  const stepOrder = ['preflight', 'frontend', 'backend', 'backendStatus'];
  const completedSteps = stepOrder.filter(s => steps[s] === 'done').length;
  const totalSteps = stepOrder.length;
  const percentage = Math.round((completedSteps / totalSteps) * 100);
  
  const currentStep = stepOrder.find(s => steps[s] === 'running');
  const currentLabel = currentStep ? stepLabels[currentStep] : (percentage === 100 ? 'Done' : 'Starting');
  
  // Build visual progress bar (30 chars wide)
  const barWidth = 30;
  const filledLength = Math.round((percentage / 100) * barWidth);
  const emptyLength = barWidth - filledLength;
  
  const filled = '█'.repeat(filledLength);
  const empty = '░'.repeat(emptyLength);
  
  // Color based on progress
  const barColor = percentage === 100 ? colors.success : colors.primary;
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return React.createElement(
    Box,
    { 
      flexDirection: 'column',
      borderStyle: 'single',
      borderColor: colors.primary,
      paddingX: 2,
      paddingY: 1,
    },
    // Title and timer
    React.createElement(
      Box,
      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
      React.createElement(
        Text,
        { color: colors.secondary, bold: true },
        'Progress'
      ),
      showTimer && React.createElement(
        Text,
        { color: colors.muted },
        formatTime(elapsed)
      )
    ),
    // Progress bar
    React.createElement(
      Box,
      { flexDirection: 'row', gap: 1 },
      React.createElement(Text, { color: barColor }, `[${filled}${empty}]`),
      React.createElement(Text, { color: barColor, bold: true }, `${percentage}%`)
    ),
    // Current step
    React.createElement(
      Box,
      { marginTop: 1, flexDirection: 'row', gap: 1 },
      React.createElement(Text, { color: colors.muted }, 'Current:'),
      React.createElement(
        Text, 
        { color: currentStep ? colors.warning : colors.success },
        currentLabel
      ),
      React.createElement(
        Text,
        { color: colors.muted },
        `(${completedSteps}/${totalSteps})`
      )
    )
  );
}
