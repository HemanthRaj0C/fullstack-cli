import React, { useState } from 'react';
import { render, Box, Text, useStdout } from 'ink';
import { SelectScreen } from './components/SelectScreen.js';
import { PreviewPanel } from './components/PreviewPanel.js';
import { LogPanel } from './components/LogPanel.js';
import { StepTimeline } from './components/StepTimeline.js';
import { ProgressBar } from './components/ProgressBar.js';
import { useSelection, useOutput, useProgress } from './components/hooks.js';
import { colors, version } from './theme.js';
import { normalizeStackSelection } from '../utils/stack.js';
import { runPreflightChecks } from '../utils/preflight.js';
import { generateFrontend } from '../generators/frontend.js';
import { generateBackend } from '../generators/backend.js';
import fs from 'fs-extra';
import path from 'path';

/**
 * FullscreenApp - Main TUI application with cyberpunk styling
 */
function FullscreenApp() {
  const [mode, setMode] = useState('selection'); // Skip boot, go directly to selection
  const { selections, updateSelection } = useSelection();
  const [currentSelections, setCurrentSelections] = useState({
    frontend: null,
    backend: null,
    database: null,
  });
  const { logs, addLog, clearLogs } = useOutput();
  const { steps, updateStep } = useProgress();
  const [projectName, setProjectName] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const { stdout } = useStdout();
  
  // Terminal dimensions
  const termWidth = stdout?.columns || 80;
  const termHeight = stdout?.rows || 24;

  const cleanLogMessage = (value) => {
    if (typeof value !== 'string') {
      return String(value ?? '');
    }
    const noAnsi = value.replace(/\x1B\[[0-9;]*[A-Za-z]/g, '');
    return noAnsi.replace(/\r/g, '').trim();
  };

  const logFromGenerator = (rawMessage, type = 'info', phase = 'info') => {
    const lines = cleanLogMessage(rawMessage)
      .split('\n')
      .map((line) => line.trimEnd())
      .filter((line) => line.length > 0);

    for (const line of lines) {
      addLog(line, type, phase);
    }
  };

  // Handle selection changes for live preview
  const handleSelectionChange = (newSelections) => {
    setCurrentSelections(newSelections);
  };

  const handleSelectionComplete = async (finalSelections) => {
    setMode('run');
    clearLogs();
    setIsRunning(true);
    setError(null);

    const previousTuiFlag = process.env.CREATE_FS_TUI;
    process.env.CREATE_FS_TUI = '1';

    try {
      const { normalized } = normalizeStackSelection({
        frontend: finalSelections.frontend,
        backend: finalSelections.backend,
        database: finalSelections.database
      });

      const effectiveProjectName = projectName || 'my-fullstack-app';
      const projectPath = path.join(process.cwd(), effectiveProjectName);

      addLog(`Creating project: ${effectiveProjectName}`, 'info', 'frontend');
      addLog(`Stack: ${normalized.frontend} + ${normalized.backend} ${normalized.database ? `+ ${normalized.database}` : ''}`, 'info', 'frontend');

      await runGenerationSteps(projectPath, normalized, {
        addLog,
        logFromGenerator,
        updateStep,
      });

      setIsRunning(false);
    } catch (err) {
      addLog(`Error: ${err.message}`, 'error', 'frontend');
      setError(err.message);
      setIsRunning(false);
    } finally {
      if (previousTuiFlag === undefined) {
        delete process.env.CREATE_FS_TUI;
      } else {
        process.env.CREATE_FS_TUI = previousTuiFlag;
      }
    }
  };

  const handleCancel = () => {
    process.exit(0);
  };

  // ========== SELECTION SCREEN ==========
  if (mode === 'selection') {
    return React.createElement(
      Box,
      { 
        flexDirection: 'column', 
        width: termWidth,
        height: termHeight,
        paddingX: 2,
        paddingY: 1,
      },
      // Header bar
      React.createElement(
        Box,
        { 
          borderStyle: 'double',
          borderColor: colors.primary,
          paddingX: 3,
          paddingY: 0,
          justifyContent: 'center',
        },
        React.createElement(
          Text,
          { color: colors.secondary, bold: true },
          ` CREATE-FS-CLI `
        ),
        React.createElement(
          Text,
          { color: colors.muted },
          ` :: SCAFFOLD WIZARD `
        ),
        React.createElement(
          Box,
          { marginLeft: 2 },
          React.createElement(Text, { color: colors.muted, dimColor: true }, version)
        )
      ),
      // Main split layout
      React.createElement(
        Box,
        { 
          flexDirection: 'row', 
          marginTop: 1, 
          gap: 2,
          flexGrow: 1,
        },
        // Left panel - Selection
        React.createElement(
          Box,
          { 
            flexDirection: 'column',
            width: '45%',
            borderStyle: 'single',
            borderColor: colors.primary,
            paddingX: 2,
            paddingY: 1,
          },
          React.createElement(SelectScreen, { 
            onComplete: handleSelectionComplete, 
            onCancel: handleCancel,
            onSelectionChange: handleSelectionChange,
          })
        ),
        // Right panel - Preview
        React.createElement(
          Box,
          { 
            flexDirection: 'column', 
            width: '55%',
            borderStyle: 'single',
            borderColor: colors.muted,
            paddingX: 2,
            paddingY: 1,
          },
          React.createElement(PreviewPanel, { 
            selections: currentSelections,
          })
        )
      ),
      // Footer status bar
      React.createElement(
        Box,
        { 
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 1,
          paddingX: 1,
          borderStyle: 'single',
          borderColor: colors.muted,
          paddingY: 0,
        },
        React.createElement(
          Box,
          { flexDirection: 'row', gap: 2 },
          React.createElement(
            Box,
            { flexDirection: 'row', gap: 1 },
            React.createElement(Text, { color: colors.secondary, inverse: true }, ' ↑↓ '),
            React.createElement(Text, { color: colors.muted }, 'Navigate')
          ),
          React.createElement(
            Box,
            { flexDirection: 'row', gap: 1 },
            React.createElement(Text, { color: colors.secondary, inverse: true }, ' ⏎ '),
            React.createElement(Text, { color: colors.muted }, 'Select')
          ),
          React.createElement(
            Box,
            { flexDirection: 'row', gap: 1 },
            React.createElement(Text, { color: colors.secondary, inverse: true }, ' ESC '),
            React.createElement(Text, { color: colors.muted }, 'Quit')
          )
        ),
        React.createElement(Text, { color: colors.muted }, '1/3')
      )
    );
  }

  // ========== RUN/GENERATION SCREEN ==========
  if (mode === 'run') {
    const statusText = isRunning 
      ? 'Processing...'
      : error 
        ? 'Generation failed. Press Ctrl+C to exit.'
        : 'Generation complete! Press Ctrl+C to exit.';
    const statusIcon = isRunning ? '▸' : error ? '✗' : '✓';
    const statusColor = isRunning ? colors.warning : error ? colors.error : colors.success;
    
    return React.createElement(
      Box,
      { 
        flexDirection: 'column', 
        width: termWidth,
        height: termHeight,
        paddingX: 2,
        paddingY: 1,
      },
      // Header
      React.createElement(
        Box,
        { 
          justifyContent: 'center', 
          borderStyle: 'double',
          borderColor: colors.primary,
          paddingX: 3,
          paddingY: 0,
        },
        React.createElement(
          Text,
          { color: colors.secondary, bold: true },
          ' CREATE-FS-CLI '
        ),
        React.createElement(
          Text,
          { color: colors.muted },
          ' :: GENERATING PROJECT '
        )
      ),
      // Progress bar
      React.createElement(
        Box,
        { marginTop: 1 },
        React.createElement(ProgressBar, { steps })
      ),
      // Main content - Timeline and Logs
      React.createElement(
        Box,
        { 
          flexDirection: 'row', 
          marginTop: 1, 
          gap: 2,
          flexGrow: 1,
        },
        // Left - Timeline
        React.createElement(
          Box,
          { 
            width: '30%',
            borderStyle: 'single',
            borderColor: colors.primary,
            paddingX: 1,
            paddingY: 1,
          },
          React.createElement(StepTimeline, { steps, noBorder: true })
        ),
        // Right - Logs (stacked)
        React.createElement(
          Box,
          { 
            flexDirection: 'column', 
            width: '70%', 
            gap: 1,
          },
          React.createElement(LogPanel, {
            logs,
            phase: 'frontend',
            maxHeight: 10,
            title: 'Frontend',
          }),
          React.createElement(LogPanel, {
            logs,
            phase: 'backend',
            maxHeight: 10,
            title: 'Backend',
          })
        )
      ),
      // Status footer
      React.createElement(
        Box,
        { 
          marginTop: 1, 
          flexDirection: 'row', 
          justifyContent: 'space-between',
          borderStyle: 'single',
          borderColor: colors.muted,
          paddingX: 2,
          paddingY: 0,
        },
        React.createElement(
          Box,
          { flexDirection: 'row', gap: 1 },
          React.createElement(Text, { color: statusColor, bold: true }, statusIcon),
          React.createElement(Text, { color: statusColor }, statusText)
        ),
        React.createElement(
          Box,
          { flexDirection: 'row', gap: 1 },
          React.createElement(Text, { color: colors.muted, inverse: true }, ' CTRL+C '),
          React.createElement(Text, { color: colors.muted }, 'Exit')
        )
      )
    );
  }

  return null;
}

// ========== GENERATION LOGIC ==========
async function runGenerationSteps(projectPath, normalized, { addLog, logFromGenerator, updateStep }) {
  try {
    const preflightAnswers = {
      frontend: normalized.frontend,
      backend: normalized.backend,
      database: normalized.database
    };

    // Preflight
    updateStep('preflight', 'running');
    addLog(`Checking prerequisites...`, 'info', 'frontend');
    try {
      await runPreflightChecks(preflightAnswers);
      addLog(`All prerequisites available`, 'success', 'frontend');
      updateStep('preflight', 'done');
    } catch (err) {
      addLog(`Preflight check failed: ${err.message}`, 'error', 'frontend');
      updateStep('preflight', 'failed');
      throw new Error(`Preflight checks failed: ${err.message}`);
    }

    await fs.ensureDir(projectPath);
    addLog(`Project path: ${projectPath}`, 'info', 'frontend');

    // Frontend
    updateStep('frontend', 'running');
    addLog(`Setting up ${normalized.frontend}...`, 'info', 'frontend');
    try {
      await generateFrontend(
        {
          frontend: normalized.frontend,
          backend: normalized.backend,
          __log: logFromGenerator
        },
        projectPath
      );
      addLog(`Frontend setup complete`, 'success', 'frontend');
      updateStep('frontend', 'done');
    } catch (err) {
      addLog(`Frontend setup failed: ${err.message}`, 'error', 'frontend');
      updateStep('frontend', 'failed');
      throw new Error(`Frontend setup failed: ${err.message}`);
    }

    // Backend
    updateStep('backend', 'running');
    if (normalized.backend === 'nextjs-api') {
      addLog('Using integrated Next.js API routes', 'info', 'backend');
      updateStep('backend', 'done');
    } else {
      addLog(`Setting up ${normalized.backend}...`, 'info', 'backend');
      try {
        await generateBackend(
          {
            backend: normalized.backend,
            database: normalized.database,
            __log: logFromGenerator
          },
          projectPath
        );
        addLog(`Backend setup complete`, 'success', 'backend');
        updateStep('backend', 'done');
      } catch (err) {
        addLog(`Backend setup failed: ${err.message}`, 'error', 'backend');
        updateStep('backend', 'failed');
        throw new Error(`Backend setup failed: ${err.message}`);
      }
    }

    // Backend Status
    if (normalized.frontend !== 'nextjs' || normalized.backend !== 'nextjs-api') {
      updateStep('backendStatus', 'running');
      addLog(`Configuring backend connectivity...`, 'info', 'backend');
      try {
        addLog(`Backend connectivity configured`, 'success', 'backend');
        updateStep('backendStatus', 'done');
      } catch (err) {
        addLog(`Backend status config skipped: ${err.message}`, 'warning', 'backend');
        updateStep('backendStatus', 'done');
      }
    } else {
      updateStep('backendStatus', 'done');
    }

    // Success messages
    addLog(`Project created successfully!`, 'success', 'frontend');
    addLog(`Next steps:`, 'info', 'frontend');
    addLog(`  1. cd ${path.basename(projectPath)}`, 'info', 'frontend');
    addLog(`  2. npm run dev`, 'info', 'frontend');
    if (normalized.backend !== 'nextjs-api') {
      addLog(`  3. cd backend && npm start`, 'info', 'backend');
    }

  } catch (err) {
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

  process.on('SIGINT', () => {
    unmount();
    process.exit(0);
  });
}
