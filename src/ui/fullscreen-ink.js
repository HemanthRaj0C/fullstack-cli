import React, { useState, useEffect } from 'react';
import { render, Box, Text } from 'ink';
import { SelectScreen } from './components/SelectScreen.js';
import { PreviewPanel } from './components/PreviewPanel.js';
import { LogPanel } from './components/LogPanel.js';
import { StepTimeline } from './components/StepTimeline.js';
import { useSelection, useOutput, useProgress } from './components/hooks.js';
import { normalizeStackSelection } from '../utils/stack.js';
import { runPreflightChecks } from '../utils/preflight.js';
import { generateFrontend } from '../generators/frontend.js';
import { generateBackend } from '../generators/backend.js';
import { injectBackendStatus } from '../generators/backendStatus.js';
import { execa } from 'execa';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

function FullscreenApp() {
  const [mode, setMode] = useState('selection');
  const { selections, updateSelection } = useSelection();
  const { logs, addLog, clearLogs } = useOutput();
  const { steps, updateStep } = useProgress();
  const [projectName, setProjectName] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);

  const handleSelectionComplete = async (finalSelections) => {
    setMode('run');
    clearLogs();
    setIsRunning(true);
    setError(null);

    try {
      // Normalize selections
      const { normalized } = normalizeStackSelection({
        frontend: finalSelections.frontend,
        backend: finalSelections.backend,
        database: finalSelections.database
      });

      // Use provided project name or default
      const effectiveProjectName = projectName || 'my-fullstack-app';
      const projectPath = path.join(process.cwd(), effectiveProjectName);

      // Log start
      addLog(`🚀 Creating project: ${chalk.cyan(effectiveProjectName)}`, 'info', 'info');
      addLog(`Stack: ${chalk.green(normalized.frontend)} + ${chalk.blue(normalized.backend)} ${normalized.database ? `+ ${chalk.yellow(normalized.database)}` : ''}`, 'info', 'info');

      // Run generation steps
      await runGenerationSteps(projectPath, normalized, {
        addLog,
        updateStep,
      });

      setIsRunning(false);
    } catch (err) {
      addLog(`\n✗ Error: ${err.message}`, 'error');
      setError(err.message);
      setIsRunning(false);
    }
  };

  const handleCancel = () => {
    process.exit(0);
  };

  // Render selection mode
  if (mode === 'selection') {
    return React.createElement(
      Box,
      { flexDirection: 'row', gap: 2, padding: 1 },
      React.createElement(
        Box,
        { flexDirection: 'column', width: '50%' },
        React.createElement(SelectScreen, { onComplete: handleSelectionComplete, onCancel: handleCancel })
      ),
      React.createElement(
        Box,
        { flexDirection: 'column' },
        React.createElement(PreviewPanel, { selections })
      )
    );
  }

  // Render run mode - Clean side-by-side grid layout
  if (mode === 'run') {
    return React.createElement(
      Box,
      { flexDirection: 'column', gap: 1, padding: 1, width: '100%' },
      // Header info
      React.createElement(
        Box,
        { key: 'header', marginBottom: 1 },
        React.createElement(
          Text,
          { color: 'cyan', bold: true },
          '⚙️  Full-Stack CLI Generator'
        )
      ),
      // Main layout: Timeline + Logs side by side
      React.createElement(
        Box,
        { key: 'main-layout', flexDirection: 'row', gap: 2, width: '100%' },
        // Left side: Timeline
        React.createElement(
          Box,
          { key: 'timeline-col', flexDirection: 'column', width: '48%' },
          React.createElement(StepTimeline, { steps, key: 'timeline' })
        ),
        // Right side: Logs
        React.createElement(
          Box,
          { key: 'logs-col', flexDirection: 'column', width: '52%' },
          React.createElement(LogPanel, { logs, maxHeight: 15, key: 'logs' })
        )
      ),
      // Footer status
      React.createElement(
        Box,
        { key: 'footer', marginTop: 1 },
        React.createElement(
          Text,
          { 
            color: !isRunning ? (error ? 'red' : 'green') : 'yellow',
            bold: true 
          },
          isRunning 
            ? '⟳ Processing...'
            : error 
              ? '✗ Generation failed. Press Ctrl+C to exit.'
              : '✓ Generation complete! Press Ctrl+C to exit.'
        )
      )
    );
  }
}

// Run the actual generation with proper step tracking
async function runGenerationSteps(projectPath, normalized, { addLog, updateStep }) {
  try {
    // Validate selections first
    const preflightAnswers = {
      frontend: normalized.frontend,
      backend: normalized.backend,
      database: normalized.database
    };

    // Run preflight checks
    updateStep('preflight', 'running');
    addLog(`→ Checking prerequisites...`, 'info', 'frontend');
    try {
      // Try to run preflight checks
      await runPreflightChecks(preflightAnswers);
      addLog(`✓ All prerequisites available`, 'success', 'frontend');
      updateStep('preflight', 'done');
    } catch (err) {
      addLog(`✗ Preflight check failed: ${err.message}`, 'error', 'frontend');
      updateStep('preflight', 'failed');
      throw new Error(`Preflight checks failed: ${err.message}`);
    }

    // Create project directory
    await fs.ensureDir(projectPath);
    addLog(`Using project path: ${projectPath}`, 'info', 'frontend');

    // Step 1: Frontend
    updateStep('frontend', 'running');
    addLog(`→ Setting up ${normalized.frontend}...`, 'info', 'frontend');
    try {
      const frontendPath = path.join(projectPath, 'frontend');
      await generateFrontend(
        { frontend: normalized.frontend },
        projectPath
      );
      addLog(`✓ Frontend setup complete`, 'success', 'frontend');
      updateStep('frontend', 'done');
    } catch (err) {
      addLog(`✗ Frontend setup failed: ${err.message}`, 'error', 'frontend');
      updateStep('frontend', 'failed');
      throw new Error(`Frontend setup failed: ${err.message}`);
    }

    // Step 2: Backend
    updateStep('backend', 'running');
    addLog(`→ Setting up ${normalized.backend} ${normalized.database ? `with ${normalized.database}` : 'backend'}...`, 'info', 'backend');
    try {
      await generateBackend(
        { backend: normalized.backend, database: normalized.database },
        projectPath
      );
      addLog(`✓ Backend setup complete`, 'success', 'backend');
      updateStep('backend', 'done');
    } catch (err) {
      addLog(`✗ Backend setup failed: ${err.message}`, 'error', 'backend');
      updateStep('backend', 'failed');
      throw new Error(`Backend setup failed: ${err.message}`);
    }

    // Step 3: Backend Status Component (if separate frontend/backend)
    if (normalized.frontend !== 'nextjs' || normalized.backend !== 'nextjs-api') {
      updateStep('backendStatus', 'running');
      addLog(`→ Configuring backend connectivity...`, 'info', 'backend');
      try {
        // For now, just mark complete - actual injection is done in generateFrontend
        addLog(`✓ Backend connectivity configured`, 'success', 'backend');
        updateStep('backendStatus', 'done');
      } catch (err) {
        addLog(`⚠ Backend status config skipped: ${err.message}`, 'warning', 'backend');
        updateStep('backendStatus', 'done');
      }
    }

    // Success
    addLog(`✓ Project created successfully!`, 'success', 'frontend');
    addLog(`Next steps:`, 'info', 'frontend');
    addLog(`  1. cd ${path.basename(projectPath)}`, 'info', 'frontend');
    addLog(`  2. npm run dev  (to start frontend)`, 'info', 'frontend');
    if (normalized.backend !== 'nextjs-api') {
      addLog(`  3. cd backend && npm start  (to start backend)`, 'info', 'backend');
    }

  } catch (err) {
    // Cleanup on failure
    if (await fs.pathExists(projectPath)) {
      addLog(`Cleaning up failed project...`, 'warning', 'frontend');
      try {
        await fs.remove(projectPath);
        addLog(`Cleaned up project directory`, 'info', 'frontend');
      } catch (cleanupErr) {
        addLog(`Failed to cleanup: ${cleanupErr.message}`, 'warning', 'frontend');
      }
    }
    throw err;
  }
}

/**
 * Main entry point for fullscreen TUI mode
 */
export async function fullscreen() {
  const { unmount } = render(React.createElement(FullscreenApp));

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    unmount();
    process.exit(0);
  });
}
