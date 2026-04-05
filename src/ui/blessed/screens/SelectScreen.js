/**
 * Select Screen - Framework selection wizard with cyberpunk-style layout
 * Features: Left sidebar navigation, dynamic preview, animated cursor
 * Uses absolute pixel calculations to ensure proper border rendering
 */

import blessed from 'blessed';
import { colors, appInfo, icons, labels } from '../theme.js';
import { getScreen, render } from '../screen.js';
import { getFrontendChoices, getBackendChoices, getDatabaseChoices } from '../../../utils/stack.js';

// Animation frames
const CURSOR_FRAMES = [icons.arrow, '▹', icons.arrow, '▹'];

// Fixed widths
const SIDEBAR_WIDTH = 20;

/**
 * Show the selection screen
 * @param {Function} onComplete - Callback with final selections
 * @param {Function} onCancel - Callback when user cancels
 */
export function showSelectScreen(onComplete, onCancel) {
  const screen = getScreen();
  const screenWidth = screen.width;
  const screenHeight = screen.height;
  
  // Calculate panel widths (absolute pixels)
  const middlePanelWidth = Math.floor((screenWidth - SIDEBAR_WIDTH) / 2);
  const rightPanelWidth = screenWidth - SIDEBAR_WIDTH - middlePanelWidth;
  
  // State
  let step = 'frontend'; // 'frontend', 'backend', 'database'
  let selectedIndex = 0;
  let selections = {
    frontend: null,
    backend: null,
    database: null,
  };
  let isActive = true;
  let cursorFrame = 0;
  let animationTimer = null;

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
    content: `{cyan-fg}{bold} ${labels.mainHeader} {/bold}{/cyan-fg}{gray-fg} :: ${labels.scaffoldWizard} {/gray-fg}`,
    align: 'center',
    valign: 'middle',
    tags: true,
    border: { type: 'line' },
    style: {
      border: { fg: colors.primary },
    },
  });

  // ===== LEFT SIDEBAR (Navigation) =====
  const sidebar = blessed.box({
    parent: container,
    top: 3,
    left: 0,
    width: SIDEBAR_WIDTH,
    height: screenHeight - 6,
    border: { type: 'line' },
    style: {
      border: { fg: colors.muted },
    },
    tags: true,
  });

  // Sidebar items
  const sidebarContent = blessed.box({
    parent: sidebar,
    top: 0,
    left: 0,
    width: SIDEBAR_WIDTH - 2,
    height: screenHeight - 8,
    tags: true,
    padding: { left: 1, top: 1 },
  });

  // ===== MIDDLE PANEL (Selection Area) =====
  const middlePanel = blessed.box({
    parent: container,
    top: 3,
    left: SIDEBAR_WIDTH,
    width: middlePanelWidth,
    height: screenHeight - 6,
    border: { type: 'line' },
    style: {
      border: { fg: colors.primary },
    },
    tags: true,
  });

  // Question label
  const questionLabel = blessed.text({
    parent: middlePanel,
    top: 1,
    left: 2,
    content: '',
    tags: true,
  });

  // Choices list area
  const choicesBox = blessed.box({
    parent: middlePanel,
    top: 3,
    left: 2,
    width: middlePanelWidth - 4,
    height: screenHeight - 11,
    tags: true,
  });

  // ===== RIGHT PANEL (Preview) =====
  const rightPanel = blessed.box({
    parent: container,
    top: 3,
    left: SIDEBAR_WIDTH + middlePanelWidth,
    width: rightPanelWidth,
    height: screenHeight - 6,
    label: ` ${labels.preview} `,
    border: { type: 'line' },
    style: {
      border: { fg: colors.secondary },
      label: { fg: colors.secondary, bold: true },
    },
    tags: true,
  });

  // Preview header
  const previewHeader = blessed.text({
    parent: rightPanel,
    top: 0,
    left: 1,
    width: rightPanelWidth - 4,
    content: '',
    tags: true,
  });

  // Preview content (scrollable)
  const previewContent = blessed.box({
    parent: rightPanel,
    top: 2,
    left: 1,
    width: rightPanelWidth - 4,
    height: screenHeight - 12,
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

  const footerContent = blessed.text({
    parent: footer,
    top: 0,
    left: 1,
    content: '',
    tags: true,
  });

  const stepIndicator = blessed.text({
    parent: footer,
    top: 0,
    right: 2,
    content: '',
    tags: true,
  });

  // ===== HELPER FUNCTIONS =====
  
  function getChoices() {
    if (step === 'frontend') return getFrontendChoices();
    if (step === 'backend') return getBackendChoices(selections.frontend);
    if (step === 'database') return getDatabaseChoices(selections.backend);
    return [];
  }

  function getStepNumber() {
    return step === 'frontend' ? 1 : step === 'backend' ? 2 : 3;
  }

  function getQuestion() {
    switch (step) {
      case 'frontend': return 'Pick your frontend';
      case 'backend': return 'Pick your backend';
      case 'database': return 'Pick your database';
      default: return 'Pick an option';
    }
  }

  function renderSidebar() {
    const categories = [
      { id: 'frontend', label: labels.frontend, icon: icons.frontend },
      { id: 'backend', label: labels.backend, icon: icons.backend },
      { id: 'database', label: labels.database, icon: icons.database },
    ];

    let content = '';
    
    categories.forEach((cat) => {
      const isActive = step === cat.id;
      const isDone = (cat.id === 'frontend' && selections.frontend) ||
                     (cat.id === 'backend' && selections.backend) ||
                     (cat.id === 'database' && selections.database);
      
      let icon = cat.icon;
      let labelColor = 'gray';
      let iconColor = 'gray';
      
      if (isActive) {
        iconColor = 'green';
        labelColor = 'green';
        icon = icons.pointer;
      } else if (isDone) {
        iconColor = 'cyan';
        labelColor = 'white';
        icon = icons.done;
      }
      
      content += `{${iconColor}-fg}${icon}{/${iconColor}-fg} {${labelColor}-fg}${cat.label}{/${labelColor}-fg}`;
      
      // Show selection under the category
      if (cat.id === 'frontend' && selections.frontend) {
        content += `\n  {gray-fg}L{/gray-fg} {cyan-fg}${getDisplayName(selections.frontend)}{/cyan-fg}`;
      } else if (cat.id === 'backend' && selections.backend) {
        content += `\n  {gray-fg}L{/gray-fg} {cyan-fg}${getDisplayName(selections.backend)}{/cyan-fg}`;
      } else if (cat.id === 'database' && selections.database) {
        content += `\n  {gray-fg}L{/gray-fg} {cyan-fg}${getDisplayName(selections.database)}{/cyan-fg}`;
      }
      
      content += '\n\n';
    });

    sidebarContent.setContent(content);
  }

  function getDisplayName(value) {
    const names = {
      'nextjs': 'Next.js',
      'react-vite': 'React + Vite',
      'svelte': 'SvelteKit',
      'nextjs-api': 'Next.js API',
      'express': 'Express',
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

  function renderChoices() {
    const choices = getChoices();
    const cursor = CURSOR_FRAMES[cursorFrame % CURSOR_FRAMES.length];
    let content = '';
    
    choices.forEach((choice, idx) => {
      const name = typeof choice === 'string' ? choice : choice.name;
      const isSelected = idx === selectedIndex;
      
      if (isSelected) {
        content += `{green-fg}${cursor}{/green-fg} {green-fg}{bold}${name}{/bold}{/green-fg}\n`;
      } else {
        content += `  {white-fg}${name}{/white-fg}\n`;
      }
    });
    
    choicesBox.setContent(content);
  }

  function renderPreview() {
    // Get current or hovered values
    const choices = getChoices();
    const hoveredChoice = choices[selectedIndex];
    const hoveredValue = typeof hoveredChoice === 'string' ? hoveredChoice : hoveredChoice?.value;

    // Current effective selections (including hovered)
    const effectiveFrontend = step === 'frontend' ? hoveredValue : selections.frontend;
    const effectiveBackend = step === 'backend' ? hoveredValue : selections.backend;
    const effectiveDatabase = step === 'database' ? hoveredValue : selections.database;

    // Header shows current config
    let headerText = '{gray-fg}// Current Stack Configuration{/gray-fg}';
    previewHeader.setContent(headerText);

    // Build comprehensive preview - use simple list format (no ASCII boxes)
    let content = '';
    
    content += '{white-fg}{bold}STACK CONFIGURATION{/bold}{/white-fg}\n';
    content += '{gray-fg}───────────────────────{/gray-fg}\n';
    
    // Frontend
    if (effectiveFrontend) {
      content += `{cyan-fg}frontend:{/cyan-fg}  {green-fg}${getDisplayName(effectiveFrontend)}{/green-fg}\n`;
    } else {
      content += `{cyan-fg}frontend:{/cyan-fg}  {yellow-fg}<selecting...>{/yellow-fg}\n`;
    }
    
    // Backend
    if (effectiveBackend) {
      content += `{cyan-fg}backend:{/cyan-fg}   {green-fg}${getDisplayName(effectiveBackend)}{/green-fg}\n`;
    } else if (selections.frontend) {
      content += `{cyan-fg}backend:{/cyan-fg}   {gray-fg}pending...{/gray-fg}\n`;
    } else {
      content += `{cyan-fg}backend:{/cyan-fg}   {gray-fg}---{/gray-fg}\n`;
    }
    
    // Database
    if (effectiveDatabase) {
      content += `{cyan-fg}database:{/cyan-fg}  {green-fg}${getDisplayName(effectiveDatabase)}{/green-fg}\n`;
    } else if (selections.backend) {
      content += `{cyan-fg}database:{/cyan-fg}  {gray-fg}pending...{/gray-fg}\n`;
    } else {
      content += `{cyan-fg}database:{/cyan-fg}  {gray-fg}---{/gray-fg}\n`;
    }
    
    content += '\n';

    // Generated package.json preview
    content += '{gray-fg}// frontend/package.json{/gray-fg}\n';
    content += '{\n';
    content += `  {cyan-fg}"name"{/cyan-fg}: {yellow-fg}"my-app"{/yellow-fg},\n`;
    content += `  {cyan-fg}"version"{/cyan-fg}: {yellow-fg}"0.1.0"{/yellow-fg},\n`;
    content += `  {cyan-fg}"private"{/cyan-fg}: {magenta-fg}true{/magenta-fg},\n`;
    
    if (effectiveFrontend) {
      content += `  {cyan-fg}"scripts"{/cyan-fg}: {\n`;
      
      if (effectiveFrontend === 'nextjs') {
        content += `    {cyan-fg}"dev"{/cyan-fg}: {yellow-fg}"next dev"{/yellow-fg},\n`;
        content += `    {cyan-fg}"build"{/cyan-fg}: {yellow-fg}"next build"{/yellow-fg},\n`;
        content += `    {cyan-fg}"start"{/cyan-fg}: {yellow-fg}"next start"{/yellow-fg}\n`;
      } else if (effectiveFrontend === 'react-vite') {
        content += `    {cyan-fg}"dev"{/cyan-fg}: {yellow-fg}"vite"{/yellow-fg},\n`;
        content += `    {cyan-fg}"build"{/cyan-fg}: {yellow-fg}"vite build"{/yellow-fg},\n`;
        content += `    {cyan-fg}"preview"{/cyan-fg}: {yellow-fg}"vite preview"{/yellow-fg}\n`;
      } else if (effectiveFrontend === 'svelte') {
        content += `    {cyan-fg}"dev"{/cyan-fg}: {yellow-fg}"vite dev"{/yellow-fg},\n`;
        content += `    {cyan-fg}"build"{/cyan-fg}: {yellow-fg}"vite build"{/yellow-fg}\n`;
      }
      
      content += `  },\n`;
      content += `  {cyan-fg}"dependencies"{/cyan-fg}: {\n`;
      
      if (effectiveFrontend === 'nextjs') {
        content += `    {cyan-fg}"next"{/cyan-fg}: {yellow-fg}"^14.0.0"{/yellow-fg},\n`;
        content += `    {cyan-fg}"react"{/cyan-fg}: {yellow-fg}"^18.2.0"{/yellow-fg},\n`;
        content += `    {cyan-fg}"react-dom"{/cyan-fg}: {yellow-fg}"^18.2.0"{/yellow-fg}\n`;
      } else if (effectiveFrontend === 'react-vite') {
        content += `    {cyan-fg}"react"{/cyan-fg}: {yellow-fg}"^18.2.0"{/yellow-fg},\n`;
        content += `    {cyan-fg}"react-dom"{/cyan-fg}: {yellow-fg}"^18.2.0"{/yellow-fg}\n`;
      } else if (effectiveFrontend === 'svelte') {
        content += `    {cyan-fg}"svelte"{/cyan-fg}: {yellow-fg}"^4.0.0"{/yellow-fg}\n`;
      }
      
      content += `  }\n`;
    }
    
    content += '}\n';

    // Backend package.json (if applicable)
    if (effectiveBackend && effectiveBackend !== 'nextjs-api') {
      content += '\n{gray-fg}// backend/package.json{/gray-fg}\n';
      content += '{\n';
      content += `  {cyan-fg}"name"{/cyan-fg}: {yellow-fg}"backend"{/yellow-fg},\n`;
      content += `  {cyan-fg}"type"{/cyan-fg}: {yellow-fg}"module"{/yellow-fg},\n`;
      content += `  {cyan-fg}"dependencies"{/cyan-fg}: {\n`;
      
      if (effectiveBackend === 'express') {
        content += `    {cyan-fg}"express"{/cyan-fg}: {yellow-fg}"^4.18.0"{/yellow-fg},\n`;
        content += `    {cyan-fg}"cors"{/cyan-fg}: {yellow-fg}"^2.8.5"{/yellow-fg}`;
      } else if (effectiveBackend === 'fastify') {
        content += `    {cyan-fg}"fastify"{/cyan-fg}: {yellow-fg}"^4.0.0"{/yellow-fg},\n`;
        content += `    {cyan-fg}"@fastify/cors"{/cyan-fg}: {yellow-fg}"^8.0.0"{/yellow-fg}`;
      } else if (effectiveBackend === 'fastapi') {
        content += `    {gray-fg}# Python backend{/gray-fg}\n`;
        content += `    {cyan-fg}"fastapi"{/cyan-fg}: {yellow-fg}"latest"{/yellow-fg}`;
      }
      
      // Database dependencies
      if (effectiveDatabase && effectiveDatabase !== 'none') {
        content += `,\n`;
        if (effectiveDatabase === 'postgres') {
          content += `    {cyan-fg}"pg"{/cyan-fg}: {yellow-fg}"^8.11.0"{/yellow-fg}`;
        } else if (effectiveDatabase === 'mongodb') {
          content += `    {cyan-fg}"mongoose"{/cyan-fg}: {yellow-fg}"^7.0.0"{/yellow-fg}`;
        } else if (effectiveDatabase === 'mysql') {
          content += `    {cyan-fg}"mysql2"{/cyan-fg}: {yellow-fg}"^3.6.0"{/yellow-fg}`;
        } else if (effectiveDatabase === 'supabase') {
          content += `    {cyan-fg}"@supabase/supabase-js"{/cyan-fg}: {yellow-fg}"^2.0.0"{/yellow-fg}`;
        }
      }
      
      content += `\n  }\n`;
      content += '}\n';
    }

    previewContent.setContent(content);
  }

  function updateFooter() {
    let content = `{green-fg}{bold} ${icons.arrowUp}${icons.arrowDown} {/bold}{/green-fg}{gray-fg}Navigate{/gray-fg}  `;
    content += `{green-fg}{bold} ${icons.success} {/bold}{/green-fg}{gray-fg}Select{/gray-fg}  `;
    
    if (step !== 'frontend') {
      content += `{green-fg}{bold} ${icons.arrowLeft} {/bold}{/green-fg}{gray-fg}Back{/gray-fg}  `;
    }
    
    content += `{green-fg}{bold} ESC {/bold}{/green-fg}{gray-fg}Quit{/gray-fg}`;
    footerContent.setContent(content);
    
    stepIndicator.setContent(`{gray-fg}Step {/gray-fg}{cyan-fg}${getStepNumber()}{/cyan-fg}{gray-fg}/3{/gray-fg}`);
  }

  function updateDisplay() {
    questionLabel.setContent(`{cyan-fg}{bold}${getQuestion()}{/bold}{/cyan-fg}`);
    updateFooter();
    renderSidebar();
    renderChoices();
    renderPreview();
    render();
  }

  function handleSelect() {
    if (!isActive) return;
    
    const choices = getChoices();
    const choice = choices[selectedIndex];
    const value = typeof choice === 'string' ? choice : choice.value;

    if (step === 'frontend') {
      selections.frontend = value;
      selections.backend = null;
      selections.database = null;
      step = 'backend';
      selectedIndex = 0;
    } else if (step === 'backend') {
      selections.backend = value;
      selections.database = null;
      step = 'database';
      selectedIndex = 0;
    } else if (step === 'database') {
      selections.database = value;
      isActive = false;
      if (animationTimer) clearInterval(animationTimer);
      screen.unkey(['up', 'k'], handleUp);
      screen.unkey(['down', 'j'], handleDown);
      screen.unkey(['enter', 'space'], handleEnter);
      screen.unkey(['backspace', 'left'], handleBackKey);
      screen.unkey(['escape', 'q'], handleEscape);
      container.destroy();
      render();
      onComplete(selections);
      return;
    }
    
    updateDisplay();
  }

  function handleBack() {
    if (!isActive) return;
    
    if (step === 'backend') {
      step = 'frontend';
      selections.frontend = null;
      selections.backend = null;
      selections.database = null;
      selectedIndex = 0;
    } else if (step === 'database') {
      step = 'backend';
      selections.backend = null;
      selections.database = null;
      selectedIndex = 0;
    }
    
    updateDisplay();
  }

  // Named handlers for cleanup
  function handleUp() {
    if (!isActive) return;
    const choices = getChoices();
    selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : choices.length - 1;
    updateDisplay();
  }

  function handleDown() {
    if (!isActive) return;
    const choices = getChoices();
    selectedIndex = selectedIndex < choices.length - 1 ? selectedIndex + 1 : 0;
    updateDisplay();
  }

  function handleEnter() {
    if (!isActive) return;
    handleSelect();
  }

  function handleBackKey() {
    if (!isActive) return;
    handleBack();
  }

  function handleEscape() {
    if (!isActive) return;
    isActive = false;
    if (animationTimer) clearInterval(animationTimer);
    screen.unkey(['up', 'k'], handleUp);
    screen.unkey(['down', 'j'], handleDown);
    screen.unkey(['enter', 'space'], handleEnter);
    screen.unkey(['backspace', 'left'], handleBackKey);
    screen.unkey(['escape', 'q'], handleEscape);
    container.destroy();
    render();
    onCancel();
  }

  // Register key handlers
  screen.key(['up', 'k'], handleUp);
  screen.key(['down', 'j'], handleDown);
  screen.key(['enter', 'space'], handleEnter);
  screen.key(['backspace', 'left'], handleBackKey);
  screen.key(['escape', 'q'], handleEscape);

  // Start cursor animation
  animationTimer = setInterval(() => {
    if (!isActive) return;
    cursorFrame++;
    renderChoices();
    render();
  }, 300);

  // Initial render
  updateDisplay();
  screen.render();
}
