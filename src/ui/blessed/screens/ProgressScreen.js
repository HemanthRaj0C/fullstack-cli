/**
 * Progress Screen - Shows generation progress with live animations and stats
 * Uses absolute pixel calculations to ensure proper border rendering
 */

import blessed from 'blessed';
import { colors, appInfo, icons, labels } from '../theme.js';
import { getScreen, render } from '../screen.js';

// Use icons from theme
const SPINNER_FRAMES = icons.spinner;
const BAR_ANIMATION_FRAMES = icons.progressEdge;

// Fixed widths
const LEFT_PANEL_WIDTH = 25;
const RIGHT_PANEL_WIDTH = 25;

/**
 * Fetch npm package stats
 */
async function fetchNpmStats() {
  try {
    const response = await fetch('https://api.npmjs.org/downloads/point/last-week/create-fs-cli');
    const data = await response.json();
    return { downloads: data.downloads || 0 };
  } catch {
    return { downloads: '---' };
  }
}

/**
 * Fetch GitHub repo stats
 */
async function fetchGitHubStats() {
  try {
    const response = await fetch('https://api.github.com/repos/HemanthRaj0C/fullstack-cli');
    const data = await response.json();
    return {
      stars: data.stargazers_count || 0,
      forks: data.forks_count || 0,
      watchers: data.subscribers_count || 0,
    };
  } catch {
    return { stars: '---', forks: '---', watchers: '---' };
  }
}

/**
 * Format number with k suffix
 */
function formatNumber(num) {
  if (typeof num !== 'number') return num;
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

/**
 * Show the progress screen
 * @param {Object} options - Configuration
 * @returns {Object} - Control methods for updating the screen
 */
export function showProgressScreen(options = {}) {
  const screen = getScreen();
  const screenWidth = screen.width;
  const screenHeight = screen.height;
  
  // Calculate middle panel width (screen - left - right panels)
  const middlePanelWidth = screenWidth - LEFT_PANEL_WIDTH - RIGHT_PANEL_WIDTH;
  const mainContentHeight = screenHeight - 12;
  
  // Steps state - using fun labels
  const steps = [
    { id: 'preflight', label: labels.preflightChecks, status: 'pending' },
    { id: 'frontend', label: labels.frontendSetup, status: 'pending' },
    { id: 'backend', label: labels.backendSetup, status: 'pending' },
    { id: 'backendStatus', label: labels.finalSetup, status: 'pending' },
  ];

  // Animation state
  let spinnerFrame = 0;
  let progressPercent = 0;
  let targetPercent = 0;
  let barAnimFrame = 0;
  let animationTimer = null;
  let statsLoaded = false;
  let npmDownloads = '---';
  let githubStars = '---';
  let githubForks = '---';

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
    content: `{cyan-fg}{bold} ${labels.mainHeader} {/bold}{/cyan-fg}{gray-fg} :: ${labels.generatingProject} {/gray-fg}`,
    align: 'center',
    valign: 'middle',
    tags: true,
    border: { type: 'line' },
    style: {
      border: { fg: colors.primary },
    },
  });

  // ===== PROGRESS BAR AREA =====
  const progressContainer = blessed.box({
    parent: container,
    top: 3,
    left: 0,
    width: screenWidth,
    height: 3,
    border: { type: 'line' },
    style: {
      border: { fg: colors.muted },
    },
    tags: true,
  });

  const progressText = blessed.text({
    parent: progressContainer,
    top: 0,
    left: 1,
    content: '',
    tags: true,
  });

  // ===== MAIN CONTENT AREA =====
  const mainContent = blessed.box({
    parent: container,
    top: 6,
    left: 0,
    width: screenWidth,
    height: mainContentHeight,
    tags: true,
  });

  // ===== LEFT PANEL (Timeline) =====
  const leftPanel = blessed.box({
    parent: mainContent,
    top: 0,
    left: 0,
    width: LEFT_PANEL_WIDTH,
    height: mainContentHeight,
    label: ` ${labels.steps} `,
    border: { type: 'line' },
    style: {
      border: { fg: colors.primary },
      label: { fg: colors.secondary, bold: true },
    },
    tags: true,
    padding: { left: 1, top: 1 },
  });

  // ===== MIDDLE PANEL (Logs) =====
  const middlePanel = blessed.box({
    parent: mainContent,
    top: 0,
    left: LEFT_PANEL_WIDTH,
    width: middlePanelWidth,
    height: mainContentHeight,
    tags: true,
  });

  const logHeight = Math.floor(mainContentHeight / 2);

  // Frontend log box
  const frontendLog = blessed.log({
    parent: middlePanel,
    top: 0,
    left: 0,
    width: middlePanelWidth,
    height: logHeight,
    label: ' Frontend ',
    border: { type: 'line' },
    style: {
      border: { fg: colors.muted },
      label: { fg: colors.secondary, bold: true },
    },
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      ch: ' ',
      style: { bg: colors.muted },
    },
    padding: { left: 1 },
  });

  // Backend log box
  const backendLog = blessed.log({
    parent: middlePanel,
    top: logHeight,
    left: 0,
    width: middlePanelWidth,
    height: mainContentHeight - logHeight,
    label: ' Backend ',
    border: { type: 'line' },
    style: {
      border: { fg: colors.muted },
      label: { fg: colors.secondary, bold: true },
    },
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      ch: ' ',
      style: { bg: colors.muted },
    },
    padding: { left: 1 },
  });

  // ===== RIGHT PANEL (Stats) =====
  const rightPanel = blessed.box({
    parent: mainContent,
    top: 0,
    left: LEFT_PANEL_WIDTH + middlePanelWidth,
    width: RIGHT_PANEL_WIDTH,
    height: mainContentHeight,
    label: ` ${labels.repoMetrics} `,
    border: { type: 'line' },
    style: {
      border: { fg: colors.primary },
      label: { fg: colors.secondary, bold: true },
    },
    tags: true,
    padding: { left: 1, top: 0 },
  });

  // Stats content
  const statsContent = blessed.box({
    parent: rightPanel,
    top: 0,
    left: 0,
    width: RIGHT_PANEL_WIDTH - 4,
    height: mainContentHeight - 2,
    tags: true,
  });

  // ===== STAR PROMPT =====
  const starPrompt = blessed.box({
    parent: container,
    bottom: 3,
    left: 0,
    width: screenWidth,
    height: 3,
    border: { type: 'line' },
    style: {
      border: { fg: colors.secondary },
    },
    tags: true,
    padding: { left: 1 },
  });

  const starPromptText = blessed.text({
    parent: starPrompt,
    top: 0,
    left: 1,
    content: `{yellow-fg}${icons.star}{/yellow-fg} {white-fg}${labels.starPrompt}{/white-fg} {green-fg}${appInfo.repo}{/green-fg}`,
    tags: true,
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

  const statusText = blessed.text({
    parent: footer,
    top: 0,
    left: 1,
    content: '',
    tags: true,
  });

  const exitHint = blessed.text({
    parent: footer,
    top: 0,
    right: 2,
    content: `{green-fg}{bold} CTRL+C {/bold}{/green-fg}{gray-fg}Exit{/gray-fg}`,
    tags: true,
  });

  // ===== ANIMATION & RENDERING =====
  
  function getAnimatedSpinner() {
    return SPINNER_FRAMES[spinnerFrame % SPINNER_FRAMES.length];
  }

  function renderAnimatedProgressBar() {
    const width = 50;
    const filled = Math.round((progressPercent / 100) * width);
    const empty = width - filled;
    
    // Create animated bar
    let bar = '';
    for (let i = 0; i < filled; i++) {
      // Add slight animation to filled portion
      if (i === filled - 1 && progressPercent < 100) {
        bar += BAR_ANIMATION_FRAMES[barAnimFrame % BAR_ANIMATION_FRAMES.length];
      } else {
        bar += '#';
      }
    }
    bar += '-'.repeat(empty);
    
    const spinner = progressPercent < 100 ? getAnimatedSpinner() + ' ' : '';
    return `{green-fg}[${bar}]{/green-fg} {white-fg}${progressPercent}%{/white-fg} ${spinner}`;
  }

  function getStepIcon(status) {
    switch (status) {
      case 'pending': return `{gray-fg}${icons.pending}{/gray-fg}`;
      case 'running': return `{yellow-fg}${getAnimatedSpinner()}{/yellow-fg}`;
      case 'done': return `{green-fg}${icons.done}{/green-fg}`;
      case 'failed': return `{red-fg}${icons.failed}{/red-fg}`;
      default: return `{gray-fg}${icons.pending}{/gray-fg}`;
    }
  }

  function renderTimeline() {
    let content = '';
    steps.forEach((step, idx) => {
      const icon = getStepIcon(step.status);
      const labelColor = step.status === 'running' ? 'yellow' 
        : step.status === 'done' ? 'green' 
        : step.status === 'failed' ? 'red' 
        : 'gray';
      
      content += `${icon} {${labelColor}-fg}${step.label}{/${labelColor}-fg}\n`;
      
      // Connection line (except for last item)
      if (idx < steps.length - 1) {
        const lineColor = step.status === 'done' ? 'green' : 'gray';
        content += `{${lineColor}-fg}${icons.line}{/${lineColor}-fg}\n`;
      }
    });
    leftPanel.setContent(content);
  }

  function renderStats() {
    const loadingSpinner = !statsLoaded ? ` ${getAnimatedSpinner()}` : '';
    
    let content = '';
    
    // NPM Section - simple clean layout
    content += `{cyan-fg}{bold}npm{/bold}{/cyan-fg}${loadingSpinner}\n`;
    content += `{gray-fg}──────────────{/gray-fg}\n`;
    content += `{white-fg}${labels.npmDownloads}{/white-fg}\n`;
    content += `{green-fg}{bold}${formatNumber(npmDownloads)}{/bold}{/green-fg}\n\n`;
    
    // GitHub Section
    content += `{magenta-fg}{bold}${labels.githubStats}{/bold}{/magenta-fg}\n`;
    content += `{gray-fg}──────────────{/gray-fg}\n`;
    content += `{yellow-fg}★{/yellow-fg} ${labels.stars}: {green-fg}${formatNumber(githubStars)}{/green-fg}\n`;
    content += `{white-fg}⑂{/white-fg} ${labels.forks}: {white-fg}${formatNumber(githubForks)}{/white-fg}\n\n`;
    
    // Status indicator
    if (statsLoaded) {
      content += `{green-fg}${icons.done}{/green-fg} {green-fg}${labels.synced}{/green-fg}`;
    } else {
      content += `{yellow-fg}${icons.pending}{/yellow-fg} {yellow-fg}${labels.loading}{/yellow-fg}`;
    }
    
    statsContent.setContent(content);
  }

  function calculateTargetProgress() {
    const completed = steps.filter(s => s.status === 'done').length;
    const running = steps.filter(s => s.status === 'running').length;
    const total = steps.length;
    return Math.round(((completed + running * 0.5) / total) * 100);
  }

  function updateStatus(message, isError = false, isDone = false) {
    const spinner = isDone ? '' : getAnimatedSpinner() + ' ';
    const icon = isDone 
      ? (isError ? `{red-fg}${icons.failed}{/red-fg}` : `{green-fg}${icons.success}{/green-fg}`)
      : `{yellow-fg}${getAnimatedSpinner()}{/yellow-fg}`;
    const color = isError ? 'red' : isDone ? 'green' : 'yellow';
    statusText.setContent(`${icon} {${color}-fg}${message}{/${color}-fg}`);
  }

  function doRender() {
    progressText.setContent(renderAnimatedProgressBar());
    renderTimeline();
    renderStats();
    render();
  }

  // Start animation loop
  function startAnimation() {
    animationTimer = setInterval(() => {
      spinnerFrame++;
      barAnimFrame++;
      
      // Smoothly animate progress toward target
      if (progressPercent < targetPercent) {
        progressPercent = Math.min(progressPercent + 2, targetPercent);
      }
      
      doRender();
    }, 80);
  }

  function stopAnimation() {
    if (animationTimer) {
      clearInterval(animationTimer);
      animationTimer = null;
    }
  }

  // Fetch stats in background
  async function loadStats() {
    try {
      const [npmStats, ghStats] = await Promise.all([
        fetchNpmStats(),
        fetchGitHubStats(),
      ]);
      
      npmDownloads = npmStats.downloads;
      githubStars = ghStats.stars;
      githubForks = ghStats.forks;
      statsLoaded = true;
      doRender();
    } catch (e) {
      // Stats failed to load, use defaults
      statsLoaded = true;
    }
  }

  // Initial render
  updateStatus('Processing...', false, false);
  startAnimation();
  loadStats();
  doRender();

  // Return control interface
  return {
    updateStep(stepId, status) {
      const step = steps.find(s => s.id === stepId);
      if (step) {
        step.status = status;
        targetPercent = calculateTargetProgress();
        doRender();
      }
    },

    addLog(message, type = 'info', phase = 'frontend') {
      const logBox = phase === 'backend' ? backendLog : frontendLog;
      
      // Clean ANSI codes from message
      let cleanMsg = message.replace(/\x1B\[[0-9;]*[A-Za-z]/g, '');
      cleanMsg = cleanMsg.replace(/\r/g, '').trim();
      
      // Skip empty messages
      if (!cleanMsg) return;
      
      // Skip noisy npm progress indicators
      if (cleanMsg.match(/^[\s]*$/)) return;
      if (cleanMsg.match(/^[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]+/)) return;
      if (cleanMsg.match(/^npm warn/i)) return;
      
      // Truncate very long lines
      const maxLen = 60;
      if (cleanMsg.length > maxLen) {
        cleanMsg = cleanMsg.substring(0, maxLen - 3) + '...';
      }
      
      let color = 'white';
      let prefix = '';
      
      switch (type) {
        case 'success':
          color = 'green';
          prefix = '{green-fg}✓{/green-fg} ';
          break;
        case 'error':
          color = 'red';
          prefix = '{red-fg}✗{/red-fg} ';
          break;
        case 'warning':
          color = 'yellow';
          prefix = '{yellow-fg}!{/yellow-fg} ';
          break;
        default:
          prefix = '{gray-fg}>{/gray-fg} ';
      }
      
      logBox.log(`${prefix}{${color}-fg}${cleanMsg}{/${color}-fg}`);
      render();
    },

    setStatus(status, isError = false, isDone = false) {
      updateStatus(status, isError, isDone);
      if (isDone) {
        progressPercent = 100;
        targetPercent = 100;
        // Keep animation running briefly to show completion
        setTimeout(() => {
          stopAnimation();
          doRender();
        }, 500);
      }
      doRender();
    },

    destroy() {
      stopAnimation();
      container.destroy();
      render();
    },

    getContainer() {
      return container;
    },
  };
}
