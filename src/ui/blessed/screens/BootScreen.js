/**
 * Boot Screen - Animated initialization with cyberpunk aesthetics
 */

import blessed from 'blessed';
import { colors, logo, bootMessages, appInfo } from '../theme.js';
import { getScreen, render } from '../screen.js';

/**
 * Show the boot screen with animated sequence
 * @param {Function} onComplete - Callback when boot animation completes
 */
export function showBootScreen(onComplete) {
  const screen = getScreen();
  
  // Main container
  const container = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  });

  // Terminal header
  const header = blessed.box({
    parent: container,
    top: 1,
    left: 2,
    width: 25,
    height: 3,
    content: ' TTY1 - ROOT@DEV ',
    border: { type: 'line' },
    style: {
      border: { fg: colors.muted },
      fg: colors.muted,
    },
  });

  // Boot messages area
  const bootArea = blessed.box({
    parent: container,
    top: 5,
    left: 2,
    width: '50%',
    height: bootMessages.length + 2,
    tags: true,
  });

  // System ready text
  const systemReady = blessed.text({
    parent: container,
    top: 5 + bootMessages.length + 1,
    left: 2,
    content: '',
    tags: true,
  });

  // Logo area
  const logoBox = blessed.box({
    parent: container,
    top: 5 + bootMessages.length + 3,
    left: 2,
    width: 60,
    height: 6,
    content: '',
    style: { fg: colors.primary },
  });

  // Tagline area
  const taglineBox = blessed.box({
    parent: container,
    top: 5 + bootMessages.length + 9,
    left: 4,
    width: 60,
    height: 3,
    content: '',
    tags: true,
  });

  // Command prompt box
  const promptBox = blessed.box({
    parent: container,
    top: 5 + bootMessages.length + 13,
    left: 2,
    width: 55,
    height: 3,
    content: '',
    border: { type: 'line' },
    style: {
      border: { fg: colors.muted },
    },
    tags: true,
  });

  // Execute button
  const executeBtn = blessed.box({
    parent: container,
    top: 5 + bootMessages.length + 16,
    left: 15,
    width: 20,
    height: 3,
    content: '',
    align: 'center',
    valign: 'middle',
    tags: true,
  });

  // Status bar at bottom
  const statusBar = blessed.box({
    parent: container,
    bottom: 1,
    left: 2,
    width: 60,
    height: 1,
    content: '',
    tags: true,
  });

  render();

  // Animation state
  let currentStep = 0;
  let phase = 'boot'; // 'boot', 'logo', 'prompt', 'ready'

  // Animate boot messages one by one
  function animateBoot() {
    if (currentStep < bootMessages.length) {
      const msg = bootMessages[currentStep];
      const statusColor = msg.status === 'OK' || msg.status === 'DONE' || msg.status === 'CONNECTED' 
        ? 'green' : 'yellow';
      
      let content = '';
      for (let i = 0; i <= currentStep; i++) {
        const m = bootMessages[i];
        const sColor = m.status === 'OK' || m.status === 'DONE' || m.status === 'CONNECTED' 
          ? 'green' : 'yellow';
        content += `{white-fg}${m.text}{/white-fg} {${sColor}-fg}{bold}${m.status}{/bold}{/${sColor}-fg}\n`;
      }
      bootArea.setContent(content);
      
      // Update status bar
      statusBar.setContent(`{gray-fg}●{/gray-fg} {yellow-fg}INITIALIZING...{/yellow-fg}`);
      
      render();
      currentStep++;
      setTimeout(animateBoot, 300);
    } else {
      phase = 'logo';
      showSystemReady();
    }
  }

  function showSystemReady() {
    systemReady.setContent('{white-fg}{bold}SYSTEM READY.{/bold}{/white-fg}');
    render();
    setTimeout(showLogo, 200);
  }

  function showLogo() {
    logoBox.setContent(logo);
    render();
    setTimeout(showTagline, 300);
  }

  function showTagline() {
    taglineBox.setContent(
      `{cyan-fg}│{/cyan-fg} {white-fg}${appInfo.tagline}{/white-fg}\n` +
      `  {gray-fg}${appInfo.version}-stable{/gray-fg}`
    );
    render();
    setTimeout(showPrompt, 300);
  }

  function showPrompt() {
    phase = 'prompt';
    promptBox.setContent(
      `{green-fg}{bold}root@dev:~${symbol}{/bold}{/green-fg} {cyan-fg}npx create-fs-cli@latest{/cyan-fg}{green-fg}█{/green-fg}`
    );
    render();
    setTimeout(showExecute, 400);
  }

  const symbol = '$';

  function showExecute() {
    phase = 'ready';
    executeBtn.setContent(`{green-fg}{bold}[ EXECUTE ]{/bold}{/green-fg}`);
    statusBar.setContent(
      `{green-fg}●{/green-fg} {gray-fg}MEM: 24MB/128MB{/gray-fg}` +
      `                              {green-fg}READY{/green-fg}`
    );
    render();
    
    // Auto-proceed after short delay
    setTimeout(() => {
      container.destroy();
      render();
      onComplete();
    }, 800);
  }

  // Handle ESC to skip
  screen.key(['escape', 'q'], () => {
    if (phase !== 'ready') {
      container.destroy();
      render();
      onComplete();
    }
  });

  // Handle Enter to skip
  screen.key(['enter', 'space'], () => {
    if (phase === 'ready') {
      container.destroy();
      render();
      onComplete();
    }
  });

  // Start animation
  animateBoot();
}
