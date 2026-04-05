/**
 * Screen Manager - Handles blessed screen and transitions
 */

import blessed from 'blessed';
import { colors } from './theme.js';

let screen = null;

/**
 * Initialize the blessed screen
 */
export function createScreen() {
  if (screen) return screen;

  screen = blessed.screen({
    smartCSR: true,
    title: 'create-fs-cli :: Scaffold Wizard',
    cursor: {
      artificial: true,
      shape: 'block',
      blink: true,
      color: colors.primary,
    },
    fullUnicode: true,
    autoPadding: true,
  });

  // Global quit keys
  screen.key(['C-c'], () => {
    cleanup();
    process.exit(0);
  });

  // Handle unexpected errors gracefully
  // Note: Don't call process.exit here as it bypasses cleanup in index.js
  process.on('uncaughtException', (err) => {
    try {
      cleanup();
      // Log error to stderr (won't interfere with TUI after cleanup)
      process.stderr.write(`\nUncaught exception: ${err.message}\n`);
    } catch {
      // Ignore cleanup errors
    }
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    try {
      cleanup();
      // Log error to stderr (won't interfere with TUI after cleanup)
      const message = reason instanceof Error ? reason.message : String(reason);
      process.stderr.write(`\nUnhandled rejection: ${message}\n`);
    } catch {
      // Ignore cleanup errors
    }
    process.exit(1);
  });

  return screen;
}

/**
 * Get the current screen instance
 */
export function getScreen() {
  return screen;
}

/**
 * Render the screen
 */
export function render() {
  if (screen) {
    try {
      screen.render();
    } catch (err) {
      // Ignore render errors on destroyed screen
    }
  }
}

/**
 * Clean up and destroy screen
 */
export function cleanup() {
  if (screen) {
    try {
      screen.destroy();
    } catch (err) {
      // Screen already destroyed
    }
    screen = null;
  }
}

/**
 * Clear all children from screen
 */
export function clearScreen() {
  if (screen) {
    // Remove all children except the screen itself
    while (screen.children.length > 0) {
      screen.children[0].destroy();
    }
  }
}

/**
 * Get terminal dimensions
 */
export function getDimensions() {
  return {
    width: screen?.width || 80,
    height: screen?.height || 24,
  };
}
