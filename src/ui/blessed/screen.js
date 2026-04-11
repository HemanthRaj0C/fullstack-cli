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
  process.on('uncaughtException', (err) => {
    try {
      cleanup();
      process.stderr.write(`\nUncaught exception: ${err.message}\n`);
    } catch {
      // Ignore cleanup errors
    }
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    try {
      cleanup();
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
 * Clean up and fully restore the terminal to its original state.
 * This fixes the issue where animated shell prompts (Starship, oh-my-zsh, etc.)
 * don't render correctly after exiting the TUI.
 */
export function cleanup() {
  if (screen) {
    try {
      const program = screen.program;

      // Stop any cursor blinking / artificial cursor
      if (program) {
        // Show the real cursor
        program.showCursor();
        // Disable mouse tracking
        program.disableMouse();
        // Exit alternate screen buffer — this is the key fix that restores
        // the normal terminal buffer and re-enables the shell's animation
        program.normalBuffer();
        // Flush any pending output
        if (program.output && program.output.write) {
          // Reset all terminal attributes, clear any lingering modes
          program.output.write('\x1b[?25h');   // show cursor
          program.output.write('\x1b[?1049l'); // exit alternate screen
          program.output.write('\x1b[0m');     // reset all attributes
          program.output.write('\x1b[?1l');    // reset application cursor keys
          program.output.write('\x1b[?7h');    // re-enable line wrapping
        }
      }

      // Destroy the blessed screen
      screen.destroy();
    } catch (err) {
      // Screen already destroyed or cleanup error — force terminal reset via escape codes
      try {
        process.stdout.write('\x1b[?25h');   // show cursor
        process.stdout.write('\x1b[?1049l'); // exit alternate screen
        process.stdout.write('\x1b[0m');     // reset all attributes
        process.stdout.write('\x1b[?7h');    // re-enable line wrap
      } catch {
        // Nothing we can do
      }
    }
    screen = null;
  }
}

/**
 * Clear all children from screen
 */
export function clearScreen() {
  if (screen) {
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
