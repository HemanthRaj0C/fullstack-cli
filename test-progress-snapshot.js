#!/usr/bin/env node

import React from 'react';
import { renderToString } from 'ink';
import { ProgressBar } from './src/ui/components/ProgressBar.js';

function TestProgressSnapshot() {
  const stepsSequence = [
    {
      steps: { preflight: 'running', frontend: 'pending', backend: 'pending', backendStatus: 'pending' },
      label: 'Step 1: Checking Prerequisites'
    },
    {
      steps: { preflight: 'done', frontend: 'running', backend: 'pending', backendStatus: 'pending' },
      label: 'Step 2: Setting up Frontend'
    },
    {
      steps: { preflight: 'done', frontend: 'done', backend: 'running', backendStatus: 'pending' },
      label: 'Step 3: Setting up Backend'
    },
    {
      steps: { preflight: 'done', frontend: 'done', backend: 'done', backendStatus: 'done' },
      label: 'Step 4: Complete'
    }
  ];

  console.log('\n' + '='.repeat(70));
  console.log('ENHANCED PROGRESS BAR FEATURE DEMO');
  console.log('='.repeat(70) + '\n');

  stepsSequence.forEach(({ steps, label }) => {
    console.log(`📍 ${label}\n`);
    try {
      const output = renderToString(React.createElement(ProgressBar, { steps }));
      console.log(output);
    } catch (err) {
      console.log(`Error rendering: ${err.message}`);
    }
    console.log('\n' + '-'.repeat(70) + '\n');
  });

  console.log('✨ Progress Bar Features:');
  console.log('  ✓ Visual progress bar (█ blocks, color-coded)');
  console.log('  ✓ Step counter [X/4 steps]');
  console.log('  ✓ Elapsed time tracking (MM:SS format)');
  console.log('  ✓ Current step indicator (▶ Currently: ...)');
  console.log('  ✓ Percentage complete with color gradient');
  console.log('  ✓ Bordered layout with cyan styling\n');
}

TestProgressSnapshot();
