/**
 * Completion Screen - Shows success message and next steps after project generation
 * Uses absolute pixel calculations to ensure proper border rendering
 */

import blessed from 'blessed';
import { colors, appInfo, icons, labels } from '../theme.js';
import { getScreen, render } from '../screen.js';

/**
 * Show the completion screen
 * @param {Object} options - Configuration
 * @param {string} options.projectName - Name of the created project
 * @param {Object} options.selections - Stack selections (frontend, backend, database)
 * @param {Function} onExit - Callback when user exits
 */
export function showCompletionScreen(options, onExit) {
  const screen = getScreen();
  const { projectName, selections } = options;
  const screenWidth = screen.width;
  const screenHeight = screen.height;
  
  let isActive = true;
  let animationTimer = null;
  let sparkleFrame = 0;
  
  // Sparkle animation frames  
  const sparkles = ['*', '+', '*', '+'];

  function ellipsize(value, maxLen) {
    const text = String(value ?? '').replace(/\s+/g, ' ').trim();
    if (maxLen <= 0) return '';
    if (text.length <= maxLen) return text;
    if (maxLen <= 3) return '.'.repeat(maxLen);
    return text.slice(0, maxLen - 3) + '...';
  }

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
    content: `{red-fg}{bold} ${icons.success} ${labels.projectCreated} ${icons.success} {/bold}{/red-fg}`,
    align: 'center',
    valign: 'middle',
    tags: true,
    border: { type: 'line' },
    style: {
      border: { fg: colors.primary },
    },
  });

  // ===== SUCCESS BANNER =====
  const banner = blessed.box({
    parent: container,
    top: 3,
    left: 2,
    width: screenWidth - 4,
    height: 7,
    tags: true,
    border: { type: 'line' },
    style: {
      border: { fg: colors.secondary },
    },
    padding: { left: 2, right: 2, top: 1 },
  });

  const bannerText = blessed.text({
    parent: banner,
    top: 0,
    left: 0,
    width: screenWidth - 8, // screen - banner margins(4) - banner borders(2) - banner padding(2)
    tags: true,
    content: '',
  });

  // ===== NEXT STEPS PANEL =====
  const stepsPanel = blessed.box({
    parent: container,
    top: 10,
    left: 2,
    width: screenWidth - 4,
    height: screenHeight - 16,
    label: ` ${labels.nextSteps} `,
    border: { type: 'line' },
    style: {
      border: { fg: colors.primary },
      label: { fg: colors.secondary, bold: true },
    },
    tags: true,
    padding: { left: 2, right: 2, top: 1 },
  });

  const stepsContent = blessed.box({
    parent: stepsPanel,
    top: 0,
    left: 0,
    width: screenWidth - 8, // screen - panel left margin(2) - panel right margin(2) - panel border(2) - panel padding(2)
    height: screenHeight - 22,
    tags: true,
    scrollable: true,
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

  const footerLeft = blessed.text({
    parent: footer,
    top: 0,
    left: 2,
    content: `{#ffffff-fg}${icons.star}{/#ffffff-fg} {#ffffff-fg}Star us:{/#ffffff-fg} {#ff0000-fg}${appInfo.repo}{/#ff0000-fg}`,
    tags: true,
  });

  const footerRight = blessed.text({
    parent: footer,
    top: 0,
    right: 2,
    content: `{#ff0000-fg}{bold} ENTER {/bold}{/#ff0000-fg}{gray-fg}${labels.exitHint}{/gray-fg}`,
    tags: true,
  });

  // ===== RENDER FUNCTIONS =====
  
  function getDisplayName(value) {
    const names = {
      'nextjs': 'Next.js',
      'react-vite': 'React + Vite',
      'svelte': 'SvelteKit',
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'nextjs-api': 'Next.js API',
      'express': 'Express.js',
      'fastify': 'Fastify',
      'fastapi': 'FastAPI',
      'postgres': 'PostgreSQL',
      'mongodb': 'MongoDB',
      'mysql': 'MySQL',
      'supabase': 'Supabase',
      'none': 'None',
    };
    return names[value] || value;
  }

  function renderBanner() {
    const sparkle = sparkles[sparkleFrame % sparkles.length];
    const nameDisplay = ellipsize(projectName, Math.max(12, screenWidth - 20));
    const frontendLanguageSuffix = selections.language ? ` (${getDisplayName(selections.language)})` : '';
    
    let content = '';
    content += `{#ff0000-fg}{bold}${sparkle} ${labels.successBanner} ${sparkle}{/bold}{/#ff0000-fg}\n\n`;
    content += `{gray-fg}Project:{/gray-fg}  {#ffffff-fg}{bold}${nameDisplay}{/bold}{/#ffffff-fg}\n`;
    content += `{gray-fg}Stack:{/gray-fg}    {#ff0000-fg}${getDisplayName(selections.frontend)}${frontendLanguageSuffix}{/#ff0000-fg}`;
    content += ` {gray-fg}+{/gray-fg} {#ff0000-fg}${getDisplayName(selections.backend)}{/#ff0000-fg}`;
    if (selections.database && selections.database !== 'none') {
      content += ` {gray-fg}+{/gray-fg} {#ff0000-fg}${getDisplayName(selections.database)}{/#ff0000-fg}`;
    }
    
    bannerText.setContent(content);
  }

  function renderSteps() {
    const isSeparateBackend = selections.backend && selections.backend !== 'nextjs-api';
    const commandWidth = Math.max(12, screenWidth - 26);
    const treeWidth = Math.max(12, screenWidth - 17);
    const envWidth = Math.max(18, screenWidth - 24);
    const projectDirDisplay = ellipsize(`${projectName}/`, treeWidth - 3);
    const frontendInstallCmd = ellipsize('cd frontend && npm install', commandWidth);
    const frontendRunCmd = ellipsize('cd frontend && npm run dev', commandWidth);
    const backendInstallCmd = selections.backend === 'fastapi'
      ? 'cd backend && pip install -r requirements.txt'
      : 'cd backend && npm install';
    const backendRunCmd = selections.backend === 'fastapi'
      ? 'cd backend && uvicorn main:app --reload --port 5000'
      : 'cd backend && npm run dev';

    const stepLine = (num, text) =>
      `{#ff4d4d-fg}${icons.done}{/#ff4d4d-fg} {#ffffff-fg}{bold}Step ${num}:{/bold}{/#ffffff-fg} {#ffffff-fg}${text}{/#ffffff-fg}\n`;
    
    let content = '';
    let stepNum = 1;
    
    // Step 1: Navigate to project
    content += stepLine(stepNum++, 'Navigate to your project');
    content += `   └ {#ff0000-fg}${ellipsize(`cd ${projectName}`, commandWidth)}{/#ff0000-fg}\n\n`;
    
    // Step 2: Install dependencies
    content += stepLine(stepNum++, 'Install dependencies');
    content += `   └ {#ff0000-fg}${frontendInstallCmd}{/#ff0000-fg}\n`;
    if (isSeparateBackend) {
      content += `   └ {#ff0000-fg}${ellipsize(backendInstallCmd, commandWidth)}{/#ff0000-fg}\n`;
    } else {
      content += `      {#7a7a7a-fg}→ create-next-app usually preinstalls deps (rerun only if needed){/#7a7a7a-fg}\n`;
    }
    content += '\n';
    
    // Step 3: Start dev servers
    if (isSeparateBackend) {
      content += stepLine(stepNum++, 'Start development servers');
      content += `   └ {#ffffff-fg}Terminal 1{/#ffffff-fg} {#7a7a7a-fg}(backend){/#7a7a7a-fg}\n`;
      content += `     {#ff0000-fg}${ellipsize(backendRunCmd, commandWidth)}{/#ff0000-fg}\n`;
      content += `      {#7a7a7a-fg}→ Opens at http://localhost:5000{/#7a7a7a-fg}\n`;
      content += `   └ {#ffffff-fg}Terminal 2{/#ffffff-fg} {#7a7a7a-fg}(frontend){/#7a7a7a-fg}\n`;
      content += `     {#ff0000-fg}${frontendRunCmd}{/#ff0000-fg}\n`;
      content += `      {#7a7a7a-fg}→ Opens at http://localhost:3000{/#7a7a7a-fg}\n\n`;
    } else {
      content += stepLine(stepNum++, 'Start the app');
      content += `   └ {#ff0000-fg}${frontendRunCmd}{/#ff0000-fg}\n`;
      content += `      {#7a7a7a-fg}→ Opens at http://localhost:3000{/#7a7a7a-fg}\n\n`;
    }
    
    // Database setup (if applicable)
    if (selections.database && selections.database !== 'none') {
      content += stepLine(stepNum++, 'Configure your database');
      
      if (selections.database === 'postgres') {
        content += `   └ Update {#ff0000-fg}.env{/#ff0000-fg} with PostgreSQL connection\n`;
        content += `      {#7a7a7a-fg}${ellipsize('DATABASE_URL="postgresql://user:pass@localhost:5432/db"', envWidth)}{/#7a7a7a-fg}\n\n`;
      } else if (selections.database === 'mongodb') {
        content += `   └ Update {#ff0000-fg}.env{/#ff0000-fg} with MongoDB connection\n`;
        content += `      {#7a7a7a-fg}${ellipsize('MONGODB_URI="mongodb://localhost:27017/mydb"', envWidth)}{/#7a7a7a-fg}\n\n`;
      } else if (selections.database === 'mysql') {
        content += `   └ Update {#ff0000-fg}.env{/#ff0000-fg} with MySQL connection\n`;
        content += `      {#7a7a7a-fg}${ellipsize('DATABASE_URL="mysql://user:pass@localhost:3306/db"', envWidth)}{/#7a7a7a-fg}\n\n`;
      } else if (selections.database === 'supabase') {
        content += `   └ Update {#ff0000-fg}.env{/#ff0000-fg} with Supabase creds\n`;
        content += `      {#7a7a7a-fg}${ellipsize('SUPABASE_URL="https://your-project.supabase.co"', envWidth)}{/#7a7a7a-fg}\n`;
        content += `      {#7a7a7a-fg}${ellipsize('SUPABASE_KEY="your-anon-key"', envWidth)}{/#7a7a7a-fg}\n\n`;
      }
    }
    
    // Project structure - using simple ASCII for perfect alignment
    content += `{#ff0000-fg}[dir]{/#ff0000-fg} {#ffffff-fg}{bold}${labels.projectStructure}{/bold}{/#ffffff-fg}\n`;
    content += `   {#ff0000-fg}${projectDirDisplay}{/#ff0000-fg}\n`;
    
    // Build tree structure with consistent spacing - color entire lines
    const frontendFlavor = selections.language
      ? `${getDisplayName(selections.frontend)} (${getDisplayName(selections.language)})`
      : getDisplayName(selections.frontend);
    const frontendLine = ellipsize(`|-- frontend/      # ${frontendFlavor} app`, treeWidth);
    content += `{#7a7a7a-fg}   ${frontendLine}{/#7a7a7a-fg}\n`;
    
    if (isSeparateBackend) {
      const backendLine = ellipsize(`|-- backend/       # ${getDisplayName(selections.backend)} server`, treeWidth);
      content += `{#7a7a7a-fg}   ${backendLine}{/#7a7a7a-fg}\n`;
    }
    
    const readmeLine = ellipsize('L-- README.md      # Getting started guide', treeWidth);
    content += `{#7a7a7a-fg}   ${readmeLine}{/#7a7a7a-fg}\n`;
    
    stepsContent.setContent(content);
  }

  function doRender() {
    renderBanner();
    renderSteps();
    render();
  }

  // Start animation
  animationTimer = setInterval(() => {
    if (!isActive) return;
    sparkleFrame++;
    renderBanner();
    render();
  }, 500);

  // Key handlers
  function handleExit() {
    if (!isActive) return;
    isActive = false;
    if (animationTimer) clearInterval(animationTimer);
    screen.unkey(['enter', 'space', 'escape', 'q'], handleExit);
    container.destroy();
    render();
    onExit();
  }

  screen.key(['enter', 'space', 'escape', 'q'], handleExit);

  // Initial render
  doRender();
  screen.render();
}
