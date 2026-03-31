import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

export function ProgressBar({ steps = {} }) {
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
    backendStatus: 'Status Component',
  };

  const stepOrder = ['preflight', 'frontend', 'backend', 'backendStatus'];
  const completedSteps = stepOrder.filter(s => steps[s] === 'done').length;
  const totalSteps = stepOrder.length;
  const percentage = Math.round((completedSteps / totalSteps) * 100);
  
  const currentStep = stepOrder.find(s => steps[s] === 'running');
  const currentLabel = currentStep ? stepLabels[currentStep] : 'Starting...';
  
  // Visual bar (40 chars wide)
  const barLength = 40;
  const filledLength = Math.round((completedSteps / totalSteps) * barLength);
  const emptyLength = barLength - filledLength;
  
  // Use gradient colors based on progress
  let barColor = 'gray';
  if (percentage < 25) barColor = 'red';
  else if (percentage < 50) barColor = 'yellow';
  else if (percentage < 100) barColor = 'cyan';
  else barColor = 'green';
  
  const filled = '█'.repeat(filledLength);
  const empty = '░'.repeat(emptyLength);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return React.createElement(
    Box,
    { 
      flexDirection: 'column', 
      gap: 0, 
      marginBottom: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      padding: 1
    },
    // Title and stats row
    React.createElement(
      Box,
      { flexDirection: 'row', gap: 2, marginBottom: 1 },
      React.createElement(
        Text,
        { color: 'cyan', bold: true },
        '📦 Project Generation'
      ),
      React.createElement(
        Text,
        { color: 'gray' },
        `[${completedSteps}/${totalSteps} steps]`
      ),
      React.createElement(
        Text,
        { color: 'gray' },
        `⏱ ${formatTime(elapsed)}`
      )
    ),
    // Progress bar
    React.createElement(
      Box,
      { flexDirection: 'row', gap: 1, alignItems: 'center' },
      React.createElement(
        Text,
        { color: barColor, bold: true },
        `[${filled}${empty}]`
      ),
      React.createElement(
        Text,
        { 
          color: percentage === 100 ? 'green' : (percentage >= 50 ? 'cyan' : 'yellow'),
          bold: true 
        },
        `${percentage}%`
      )
    ),
    // Current step info
    React.createElement(
      Box,
      { flexDirection: 'row', gap: 1, marginTop: 1 },
      React.createElement(
        Text,
        { color: 'yellow' },
        '▶'
      ),
      React.createElement(
        Text,
        { color: 'yellow', italic: true },
        `Currently: ${currentLabel}`
      )
    )
  );
}
