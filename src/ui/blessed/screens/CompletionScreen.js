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
    content: `{green-fg}{bold} ${icons.success} ${labels.projectCreated} ${icons.success} {/bold}{/green-fg}`,
    align: 'center',
    valign: 'middle',
    tags: true,
    border: { type: 'line' },
    style: {
      border: { fg: colors.success },
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
    content: `{yellow-fg}${icons.star}{/yellow-fg} {white-fg}Star us:{/white-fg} {cyan-fg}${appInfo.repo}{/cyan-fg}`,
    tags: true,
  });

  const footerRight = blessed.text({
    parent: footer,
    top: 0,
    right: 2,
    content: `{green-fg}{bold} ENTER {/bold}{/green-fg}{gray-fg}${labels.exitHint}{/gray-fg}`,
    tags: true,
  });

  // ===== RENDER FUNCTIONS =====
  
  function getDisplayName(value) {
    const names = {
      'nextjs': 'Next.js',
      'react-vite': 'React + Vite',
      'svelte': 'SvelteKit',
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
    
    let content = '';
    content += `{green-fg}{bold}${sparkle} ${labels.successBanner} ${sparkle}{/bold}{/green-fg}\n\n`;
    content += `{gray-fg}Project:{/gray-fg}  {white-fg}{bold}${projectName}{/bold}{/white-fg}\n`;
    content += `{gray-fg}Stack:{/gray-fg}    {cyan-fg}${getDisplayName(selections.frontend)}{/cyan-fg}`;
    content += ` {gray-fg}+{/gray-fg} {cyan-fg}${getDisplayName(selections.backend)}{/cyan-fg}`;
    if (selections.database && selections.database !== 'none') {
      content += ` {gray-fg}+{/gray-fg} {cyan-fg}${getDisplayName(selections.database)}{/cyan-fg}`;
    }
    
    bannerText.setContent(content);
  }

  function renderSteps() {
    const isSeparateBackend = selections.backend && selections.backend !== 'nextjs-api';
    
    let content = '';
    
    // Step 1: Navigate to project
    content += `{green-fg}${icons.done}{/green-fg} {white-fg}{bold}Step 1:{/bold}{/white-fg} Navigate to your project\n`;
    content += `   L {cyan-fg}cd ${projectName}{/cyan-fg}\n\n`;
    
    // Step 2: Start frontend
    content += `{green-fg}${icons.done}{/green-fg} {white-fg}{bold}Step 2:{/bold}{/white-fg} Start the frontend dev server\n`;
    content += `   L {cyan-fg}cd frontend && npm run dev{/cyan-fg}\n`;
    content += `      {gray-fg}-> Opens at http://localhost:3000{/gray-fg}\n\n`;
    
    // Step 3: Start backend (if separate)
    if (isSeparateBackend) {
      content += `{green-fg}${icons.done}{/green-fg} {white-fg}{bold}Step 3:{/bold}{/white-fg} Start the backend server {yellow-fg}(new terminal){/yellow-fg}\n`;
      
      if (selections.backend === 'fastapi') {
        content += `   L {cyan-fg}cd backend && uvicorn main:app --reload{/cyan-fg}\n`;
        content += `      {gray-fg}-> Opens at http://localhost:8000{/gray-fg}\n\n`;
      } else {
        content += `   L {cyan-fg}cd backend && npm start{/cyan-fg}\n`;
        content += `      {gray-fg}-> Opens at http://localhost:4000{/gray-fg}\n\n`;
      }
    }
    
    // Database setup (if applicable)
    if (selections.database && selections.database !== 'none') {
      const stepNum = isSeparateBackend ? 4 : 3;
      content += `{yellow-fg}${icons.warning}{/yellow-fg} {white-fg}{bold}Step ${stepNum}:{/bold}{/white-fg} Configure your database\n`;
      
      if (selections.database === 'postgres') {
        content += `   L Update {cyan-fg}.env{/cyan-fg} with PostgreSQL connection\n`;
        content += `      {gray-fg}DATABASE_URL="postgresql://user:pass@localhost:5432/db"{/gray-fg}\n\n`;
      } else if (selections.database === 'mongodb') {
        content += `   L Update {cyan-fg}.env{/cyan-fg} with MongoDB connection\n`;
        content += `      {gray-fg}MONGODB_URI="mongodb://localhost:27017/mydb"{/gray-fg}\n\n`;
      } else if (selections.database === 'mysql') {
        content += `   L Update {cyan-fg}.env{/cyan-fg} with MySQL connection\n`;
        content += `      {gray-fg}DATABASE_URL="mysql://user:pass@localhost:3306/db"{/gray-fg}\n\n`;
      } else if (selections.database === 'supabase') {
        content += `   L Update {cyan-fg}.env{/cyan-fg} with Supabase creds\n`;
        content += `      {gray-fg}SUPABASE_URL="https://your-project.supabase.co"{/gray-fg}\n`;
        content += `      {gray-fg}SUPABASE_KEY="your-anon-key"{/gray-fg}\n\n`;
      }
    }
    
    // Project structure - using simple ASCII for perfect alignment
    content += `{magenta-fg}[dir]{/magenta-fg} {white-fg}{bold}${labels.projectStructure}{/bold}{/white-fg}\n`;
    content += `   {cyan-fg}${projectName}/{/cyan-fg}\n`;
    
    // Build tree structure with consistent spacing - color entire lines
    const frontendLine = `   |-- frontend/      # ${getDisplayName(selections.frontend)} app`;
    content += `{gray-fg}${frontendLine}{/gray-fg}\n`;
    
    if (isSeparateBackend) {
      const backendLine = `   |-- backend/       # ${getDisplayName(selections.backend)} server`;
      content += `{gray-fg}${backendLine}{/gray-fg}\n`;
    }
    
    const readmeLine = `   L-- README.md      # Getting started guide`;
    content += `{gray-fg}${readmeLine}{/gray-fg}\n`;
    
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
