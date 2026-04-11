/**
 * Blessed TUI - Main entry point
 * Fullscreen terminal UI for create-fs-cli
 */

import { createScreen, render, cleanup, clearScreen } from './screen.js';
import { showBootScreen } from './screens/BootScreen.js';
import { showSelectScreen } from './screens/SelectScreen.js';
import { showProgressScreen } from './screens/ProgressScreen.js';
import { showCompletionScreen } from './screens/CompletionScreen.js';
import { showErrorScreen } from './screens/ErrorScreen.js';
import { normalizeStackSelection } from '../../utils/stack.js';
import { runPreflightChecks } from '../../utils/preflight.js';
import { generateFrontend } from '../../generators/frontend.js';
import { generateBackend } from '../../generators/backend.js';
import fs from 'fs-extra';
import path from 'path';

// Shared exit resolver (set by fullscreen promise)
let exitResolver = null;

/**
 * Clean exit - cleanup screen and exit process so terminal is fully restored.
 * Calling process.exit(0) is required to ensure the alternate screen buffer
 * is fully released, which restores animated shell prompts (Starship, etc.).
 */
function exitTUI() {
  cleanup();
  if (exitResolver) {
    exitResolver();
    exitResolver = null;
  }
  // Force process exit so the terminal is fully restored — without this,
  // the alternate screen buffer may linger, breaking shell prompt animations.
  process.exit(0);
}

/**
 * Run the fullscreen TUI application
 * @param {Object} options - Options
 * @param {boolean} options.skipBoot - Skip boot screen and go directly to selection
 * @returns {Promise} - Resolves when TUI completes
 */
export async function fullscreen(options = {}) {
  const { skipBoot = true } = options; // projectName is now captured inside the TUI wizard
  
  // Initialize screen
  const screen = createScreen();
  
  // Return a Promise that only resolves when the TUI exits
  return new Promise((resolve) => {
    // Store the resolver for use by other functions
    exitResolver = resolve;
    
    // Handle cleanup on exit signals
    const handleExit = () => {
      exitTUI();
      // exitTUI() already calls process.exit(0)
    };

    process.on('SIGINT', handleExit);
    process.on('SIGTERM', handleExit);

    // Function to start selection
    const startSelection = () => {
      showSelectScreen(
        async (selections) => {
          // User completed selection — projectName is part of selections now
          await runGeneration(selections);
        },
        () => {
          // User cancelled
          exitTUI();
        },
        options.initialProjectName  // pre-fill project name if provided via CLI arg
      );
    };

    if (skipBoot) {
      // Go directly to selection screen
      startSelection();
    } else {
      // Start with boot screen
      showBootScreen(() => {
        startSelection();
      });
    }

    render();
  });
}

/**
 * Run the generation process with progress UI
 */
async function runGeneration(selections, options = {}) {
  const progressUI = showProgressScreen();
  
  // Set environment flag for TUI mode
  const previousTuiFlag = process.env.CREATE_FS_TUI;
  process.env.CREATE_FS_TUI = '1';

  // projectName comes from selections (captured inside TUI wizard)
  const projectName = selections.projectName?.trim() || options.projectName?.trim() || 'my-fullstack-app';
  const projectPath = path.join(process.cwd(), projectName);
  let projectCreatedByRun = false;
  let projectExistedBeforeRun = false;

  try {
    const { normalized } = normalizeStackSelection({
      frontend: selections.frontend,
      backend: selections.backend,
      database: selections.database,
    });

    progressUI.addLog(`Creating project: ${projectName}`, 'info', 'frontend');
    progressUI.addLog(
      `Stack: ${normalized.frontend} + ${normalized.backend}${normalized.database !== 'none' ? ` + ${normalized.database}` : ''}`,
      'info',
      'frontend'
    );

    projectExistedBeforeRun = await fs.pathExists(projectPath);

    // Step 1: Preflight checks
    progressUI.updateStep('preflight', 'running');
    progressUI.addLog('Checking prerequisites...', 'info', 'frontend');

    try {
      await runPreflightChecks({
        frontend: normalized.frontend,
        backend: normalized.backend,
        database: normalized.database,
      });
      progressUI.addLog('All prerequisites available', 'success', 'frontend');
      progressUI.updateStep('preflight', 'done');
    } catch (err) {
      progressUI.addLog(`Preflight failed: ${err.message}`, 'error', 'frontend');
      progressUI.updateStep('preflight', 'failed');
      throw new Error(`Preflight checks failed: ${err.message}`);
    }

    const overwriteConfirmed =
      selections.overwriteExisting === true &&
      Number.isFinite(selections.overwriteConfirmedAt);

    // Check if project directory already exists
    if (projectExistedBeforeRun) {
      if (!overwriteConfirmed) {
        throw new Error(`Directory '${projectName}' already exists! Please choose a different name.`);
      }
      progressUI.addLog('Removing existing directory (overwrite confirmed)...', 'warning', 'frontend');
      await fs.remove(projectPath);
    }

    // Create project directory
    await fs.ensureDir(projectPath);
    projectCreatedByRun = true;
    progressUI.addLog(`Project path: ${projectPath}`, 'info', 'frontend');

    // Step 2: Frontend setup
    progressUI.updateStep('frontend', 'running');
    progressUI.addLog(`Setting up ${normalized.frontend}...`, 'info', 'frontend');

    try {
      await generateFrontend(
        {
          frontend: normalized.frontend,
          backend: normalized.backend,
          __log: (msg, type, phase) => {
            const cleanMsg = cleanLogMessage(msg);
            if (cleanMsg) {
              progressUI.addLog(cleanMsg, type || 'info', phase || 'frontend');
            }
          },
        },
        projectPath
      );
      progressUI.addLog('Frontend setup complete', 'success', 'frontend');
      progressUI.updateStep('frontend', 'done');
    } catch (err) {
      progressUI.addLog(`Frontend setup failed: ${err.message}`, 'error', 'frontend');
      progressUI.updateStep('frontend', 'failed');
      throw new Error(`Frontend setup failed: ${err.message}`);
    }

    // Step 3: Backend setup
    progressUI.updateStep('backend', 'running');

    if (normalized.backend === 'nextjs-api') {
      progressUI.addLog('Using integrated Next.js API routes', 'info', 'backend');
      progressUI.updateStep('backend', 'done');
    } else {
      progressUI.addLog(`Setting up ${normalized.backend}...`, 'info', 'backend');

      try {
        await generateBackend(
          {
            backend: normalized.backend,
            database: normalized.database,
            __log: (msg, type, phase) => {
              const cleanMsg = cleanLogMessage(msg);
              if (cleanMsg) {
                progressUI.addLog(cleanMsg, type || 'info', phase || 'backend');
              }
            },
          },
          projectPath
        );
        progressUI.addLog('Backend setup complete', 'success', 'backend');
        progressUI.updateStep('backend', 'done');
      } catch (err) {
        progressUI.addLog(`Backend setup failed: ${err.message}`, 'error', 'backend');
        progressUI.updateStep('backend', 'failed');
        throw new Error(`Backend setup failed: ${err.message}`);
      }
    }

    // Step 4: Final setup
    progressUI.updateStep('backendStatus', 'running');
    progressUI.addLog('Finishing up...', 'info', 'backend');
    progressUI.updateStep('backendStatus', 'done');

    // Success!
    progressUI.addLog('', 'info', 'frontend');
    progressUI.addLog('Project created successfully!', 'success', 'frontend');

    progressUI.setStatus('Generation complete!', false, true);
    
    // Wait a moment then show completion screen
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Destroy progress UI and show completion screen
    progressUI.destroy();
    
    showCompletionScreen(
      {
        projectName,
        selections: normalized,
      },
      () => {
        // User exited completion screen - use exitTUI for proper cleanup
        exitTUI();
      }
    );

  } catch (err) {
    // Cleanup on failure
    if (projectCreatedByRun && await fs.pathExists(projectPath)) {
      progressUI.addLog('Cleaning up failed project...', 'warning', 'frontend');
      try {
        await fs.remove(projectPath);
        progressUI.addLog('Cleaned up project directory', 'info', 'frontend');
      } catch (cleanupErr) {
        progressUI.addLog(`Failed to cleanup: ${cleanupErr.message}`, 'warning', 'frontend');
      }
    }
    
    // Wait a moment to show cleanup logs
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Destroy progress UI
    progressUI.destroy();
    
    // Determine which step failed
    let failedStep = 'unknown';
    if (err.message.includes('Preflight')) {
      failedStep = 'preflight';
    } else if (err.message.includes('Frontend')) {
      failedStep = 'frontend';
    } else if (err.message.includes('Backend')) {
      failedStep = 'backend';
    }
    
    // Show error screen with retry option
    showErrorScreen(
      {
        error: err.message,
        step: failedStep,
      },
      () => {
        // User wants to retry - restart from selection
        showSelectScreen(
          async (newSelections) => {
            await runGeneration(newSelections);
          },
          () => {
            exitTUI();
          },
          projectName  // pre-fill the project name from the failed attempt
        );
      },
      () => {
        // User wants to exit
        exitTUI();
      }
    );
  } finally {
    // Restore environment
    if (previousTuiFlag === undefined) {
      delete process.env.CREATE_FS_TUI;
    } else {
      process.env.CREATE_FS_TUI = previousTuiFlag;
    }
  }
}

/**
 * Clean log message from ANSI codes and extra whitespace
 */
function cleanLogMessage(value) {
  if (typeof value !== 'string') {
    return String(value ?? '');
  }
  // Remove ANSI codes
  let clean = value.replace(/\x1B\[[0-9;]*[A-Za-z]/g, '');
  // Remove carriage returns
  clean = clean.replace(/\r/g, '');
  // Trim whitespace
  clean = clean.trim();
  // Skip spinner frames
  if (clean.match(/^[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]+$/)) return '';
  // Skip empty
  if (!clean) return '';
  return clean;
}
