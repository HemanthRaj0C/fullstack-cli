/**
 * Error Screen - Shows error details with options to retry or exit
 */

import blessed from 'blessed';
import { colors, icons } from '../theme.js';
import { getScreen, render } from '../screen.js';

/**
 * Show the error screen
 * @param {Object} options - Configuration
 * @param {string} options.error - Error message
 * @param {string} options.step - Which step failed (preflight, frontend, backend)
 * @param {Function} onRetry - Callback when user wants to retry
 * @param {Function} onExit - Callback when user exits
 */
export function showErrorScreen(options, onRetry, onExit) {
  const screen = getScreen();
  const { error, step = 'unknown' } = options;
  const screenWidth = screen.width;
  const screenHeight = screen.height;
  
  let isActive = true;

  // Main container
  const container = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenHeight,
  });

  // ===== HEADER =====
  const header = blessed.box({
    parent: container,
    top: 0,
    left: 0,
    width: screenWidth,
    height: 3,
    content: `{#ff0000-fg}{bold} ${icons.error} Oops! Something went wrong ${icons.error} {/bold}{/#ff0000-fg}`,
    align: 'center',
    valign: 'middle',
    tags: true,
    border: { type: 'line' },
    style: {
      border: { fg: colors.error },
    },
  });

  // ===== ERROR DETAILS BOX =====
  const errorBox = blessed.box({
    parent: container,
    top: 3,
    left: 2,
    width: screenWidth - 4,
    height: screenHeight - 12,
    label: ' Error Details ',
    border: { type: 'line' },
    style: {
      border: { fg: colors.error },
      label: { fg: colors.error, bold: true },
    },
    tags: true,
    padding: { left: 2, right: 2, top: 1 },
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      ch: ' ',
      style: { bg: colors.muted },
    },
  });

  const errorContent = blessed.box({
    parent: errorBox,
    top: 0,
    left: 0,
    width: screenWidth - 8, // screen - errorBox margins(4) - errorBox borders(2) - errorBox padding(2)
    tags: true,
  });

  // Build error content
  let content = '';
  
  // Step that failed
  const stepNames = {
    preflight: 'Preflight Checks',
    frontend: 'Frontend Setup',
    backend: 'Backend Setup',
    final: 'Final Setup',
  };
  
  content += `{#ffffff-fg}{bold}Failed Step:{/bold}{/#ffffff-fg} {#ffffff-fg}${stepNames[step] || step}{/#ffffff-fg}\n\n`;
  
  // Error message - truncate if too long
  const errorMsg = error || 'Unknown error occurred';
  const maxLength = 500;
  let displayError = errorMsg;
  
  if (errorMsg.length > maxLength) {
    // Find the key part of the error
    const lines = errorMsg.split('\n');
    const importantLine = lines.find(line => 
      line.includes('Error:') || 
      line.includes('failed') || 
      line.includes('Command failed')
    ) || lines[0];
    
    displayError = importantLine.length > maxLength 
      ? importantLine.substring(0, maxLength) + '...'
      : importantLine;
  }
  
  content += `{#ff0000-fg}{bold}Error Message:{/bold}{/#ff0000-fg}\n`;
  content += `{gray-fg}${displayError}{/gray-fg}\n\n`;
  
  // Helpful tips based on step
  content += `{#ff0000-fg}{bold}Common Fixes:{/bold}{/#ff0000-fg}\n`;
  
  if (step === 'preflight') {
    content += `{gray-fg}• Make sure Node.js and npm are installed{/gray-fg}\n`;
    content += `{gray-fg}• Check your internet connection{/gray-fg}\n`;
    content += `{gray-fg}• Try running: npm --version{/gray-fg}\n`;
  } else if (step === 'frontend') {
    content += `{gray-fg}• Check your internet connection{/gray-fg}\n`;
    content += `{gray-fg}• Try clearing npm cache: npm cache clean --force{/gray-fg}\n`;
    content += `{gray-fg}• Make sure you have write permissions{/gray-fg}\n`;
    content += `{gray-fg}• Try a different project name{/gray-fg}\n`;
  } else if (step === 'backend') {
    content += `{gray-fg}• Check your internet connection{/gray-fg}\n`;
    content += `{gray-fg}• Make sure backend dependencies are available{/gray-fg}\n`;
    content += `{gray-fg}• Try clearing npm cache: npm cache clean --force{/gray-fg}\n`;
  }
  
  errorContent.setContent(content);

  // ===== OPTIONS BOX =====
  const optionsBox = blessed.box({
    parent: container,
    bottom: 3,
    left: 2,
    width: screenWidth - 4,
    height: 5,
    label: ' What would you like to do? ',
    border: { type: 'line' },
    style: {
      border: { fg: colors.primary },
      label: { fg: colors.secondary, bold: true },
    },
    tags: true,
    padding: { left: 2, top: 1 },
  });

  const optionsText = blessed.text({
    parent: optionsBox,
    top: 0,
    left: 0,
    width: screenWidth - 8, // screen - optionsBox margins(4) - optionsBox borders(2) - optionsBox padding left(2)
    tags: true,
    content: `{#ff0000-fg}{bold}R{/bold}{/#ff0000-fg} {#ffffff-fg}Retry{/#ffffff-fg}    {#ff0000-fg}{bold}ESC{/bold}{/#ff0000-fg} {#ffffff-fg}Exit{/#ffffff-fg}    {#ffffff-fg}{bold}ENTER{/bold}{/#ffffff-fg} {#ffffff-fg}Exit{/#ffffff-fg}`,
  });

  // ===== FOOTER =====
  const footer = blessed.box({
    parent: container,
    bottom: 0,
    left: 0,
    width: screenWidth,
    height: 3,
    valign: 'middle',
    tags: true,
    padding: { left: 1 },
    border: { type: 'line' },
    style: {
      border: { fg: colors.muted },
    },
  });

  const footerText = blessed.text({
    parent: footer,
    top: 0,
    left: 2,
    content: `{#ffffff-fg}${icons.warning}{/#ffffff-fg} {gray-fg}Don't worry, we cleaned up the failed project directory{/gray-fg}`,
    tags: true,
  });

  // ===== KEY HANDLERS =====
  function handleRetry() {
    if (!isActive) return;
    isActive = false;
    screen.unkey(['r', 'R'], handleRetry);
    screen.unkey(['escape', 'q', 'enter', 'C-c'], handleExit);
    container.destroy();
    render();
    if (onRetry) onRetry();
  }

  function handleExit() {
    if (!isActive) return;
    isActive = false;
    screen.unkey(['r', 'R'], handleRetry);
    screen.unkey(['escape', 'q', 'enter', 'C-c'], handleExit);
    container.destroy();
    render();
    if (onExit) onExit();
  }

  screen.key(['r', 'R'], handleRetry);
  screen.key(['escape', 'q', 'enter', 'C-c'], handleExit);

  // Focus the error box for scrolling
  errorBox.focus();
  
  render();

  return {
    destroy: () => {
      if (!isActive) return;
      isActive = false;
      container.destroy();
    },
  };
}
