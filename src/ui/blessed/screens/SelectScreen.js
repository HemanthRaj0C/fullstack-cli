/**
 * Select Screen - Framework selection wizard with cyberpunk-style layout
 * Features: Left sidebar navigation, dynamic preview, animated cursor
 * Step 0: project name input (themed), then frontend → backend → database
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
 * @param {Function} onComplete - Callback with final selections (includes projectName)
 * @param {Function} onCancel  - Callback when user cancels
 * @param {string}   [initialProjectName] - Pre-filled project name (optional)
 */
export function showSelectScreen(onComplete, onCancel, initialProjectName) {
  const screen = getScreen();
  const screenWidth = screen.width;
  const screenHeight = screen.height;

  // Calculate panel widths (absolute pixels)
  const middlePanelWidth = Math.floor((screenWidth - SIDEBAR_WIDTH) / 2);
  const rightPanelWidth = screenWidth - SIDEBAR_WIDTH - middlePanelWidth;

  // ──────────────────────────────────────────────────
  // State
  // step: 'projectName' | 'frontend' | 'backend' | 'database'
  // ──────────────────────────────────────────────────
  let step = 'projectName';
  let selectedIndex = 0;
  let selections = {
    projectName: initialProjectName || '',
    frontend: null,
    backend: null,
    database: null,
  };
  let isActive = true;
  let cursorFrame = 0;
  let animationTimer = null;

  // Transition guard — prevents a held-down Enter from
  // double-firing across step boundaries
  let transitionLocked = false;

  // ────── project name input buffer ──────
  let nameBuffer = initialProjectName || '';
  let nameError = '';

  // ================================================================
  // LAYOUT
  // ================================================================

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

  // ── Project name input widget (shown only on 'projectName' step) ──
  const nameInputBox = blessed.box({
    parent: middlePanel,
    top: 3,
    left: 2,
    width: middlePanelWidth - 6,
    height: 3,
    hidden: true,
    tags: true,
    border: { type: 'line' },
    style: {
      border: { fg: colors.secondary },
    },
  });

  // Single text element for the name input — displays the typed text + cursor
  const nameInputText = blessed.text({
    parent: nameInputBox,
    top: 0,
    left: 0,
    width: middlePanelWidth - 10,
    height: 1,
    content: '',
    tags: true,
  });

  // Error/hint label under input
  const nameHintLabel = blessed.text({
    parent: middlePanel,
    top: 7,
    left: 2,
    content: '',
    tags: true,
    hidden: true,
  });

  // Choices list area (shown for all non-name steps)
  const choicesBox = blessed.box({
    parent: middlePanel,
    top: 3,
    left: 2,
    width: middlePanelWidth - 4,
    height: screenHeight - 11,
    tags: true,
    hidden: true,
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

  const previewHeader = blessed.text({
    parent: rightPanel,
    top: 0,
    left: 1,
    width: rightPanelWidth - 4,
    content: '',
    tags: true,
  });

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

  // ================================================================
  // HELPERS
  // ================================================================

  function getChoices() {
    if (step === 'frontend') return getFrontendChoices();
    if (step === 'backend') return getBackendChoices(selections.frontend);
    if (step === 'database') return getDatabaseChoices(selections.backend);
    return [];
  }

  function getStepNumber() {
    switch (step) {
      case 'projectName': return 1;
      case 'frontend':    return 2;
      case 'backend':     return 3;
      case 'database':    return 4;
      default:            return 1;
    }
  }

  function getTotalSteps() { return 4; }

  function getQuestion() {
    switch (step) {
      case 'projectName': return 'Name your project';
      case 'frontend':    return 'Pick your frontend';
      case 'backend':     return 'Pick your backend';
      case 'database':    return 'Pick your database';
      default:            return 'Pick an option';
    }
  }

  function validateName(input) {
    if (!input || input.trim() === '') return 'Project name cannot be empty';
    if (!/^[a-zA-Z0-9_-]+$/.test(input.trim())) {
      return 'Only letters, numbers, dashes and underscores allowed (no spaces)';
    }
    return null;
  }

  // ── Sidebar render ──────────────────────────────────────────────
  function renderSidebar() {
    const categories = [
      { id: 'projectName', label: 'Project',  icon: icons.folder },
      { id: 'frontend',    label: labels.frontend,  icon: icons.frontend },
      { id: 'backend',     label: labels.backend,   icon: icons.backend  },
      { id: 'database',    label: labels.database,  icon: icons.database },
    ];

    let content = '';

    categories.forEach((cat) => {
      const isCurrentStep = step === cat.id;
      const isDone =
        (cat.id === 'projectName' && selections.projectName) ||
        (cat.id === 'frontend'    && selections.frontend)    ||
        (cat.id === 'backend'     && selections.backend)     ||
        (cat.id === 'database'    && selections.database);

      let icon = cat.icon;
      let labelColor = 'gray';
      let iconColor  = 'gray';

      if (isCurrentStep) {
        iconColor  = 'green';
        labelColor = 'green';
        icon = icons.pointer;
      } else if (isDone) {
        iconColor  = 'cyan';
        labelColor = 'white';
        icon = icons.done;
      }

      content += `{${iconColor}-fg}${icon}{/${iconColor}-fg} {${labelColor}-fg}${cat.label}{/${labelColor}-fg}`;

      // Show chosen value under category
      if (cat.id === 'projectName' && selections.projectName) {
        content += `\n  {gray-fg}└{/gray-fg} {cyan-fg}${selections.projectName}{/cyan-fg}`;
      } else if (cat.id === 'frontend' && selections.frontend) {
        content += `\n  {gray-fg}└{/gray-fg} {cyan-fg}${getDisplayName(selections.frontend)}{/cyan-fg}`;
      } else if (cat.id === 'backend' && selections.backend) {
        content += `\n  {gray-fg}└{/gray-fg} {cyan-fg}${getDisplayName(selections.backend)}{/cyan-fg}`;
      } else if (cat.id === 'database' && selections.database) {
        content += `\n  {gray-fg}└{/gray-fg} {cyan-fg}${getDisplayName(selections.database)}{/cyan-fg}`;
      }

      content += '\n\n';
    });

    sidebarContent.setContent(content);
  }

  function getDisplayName(value) {
    const names = {
      'nextjs':       'Next.js',
      'react-vite':   'React + Vite',
      'svelte':       'SvelteKit',
      'nextjs-api':   'Next.js API',
      'express':      'Express',
      'fastify':      'Fastify',
      'fastapi':      'FastAPI',
      'postgres':     'PostgreSQL',
      'mongodb':      'MongoDB',
      'mysql':        'MySQL',
      'supabase':     'Supabase',
      'none':         'None',
    };
    return names[value] || value;
  }

  // ── Name input render ───────────────────────────────────────────
  let nameCursorVisible = true;
  function renderNameInput() {
    const displayText = nameBuffer;
    const cursorChar = nameCursorVisible ? '{green-fg}▌{/green-fg}' : ' ';

    nameInputText.setContent(`{white-fg}${displayText}{/white-fg}${cursorChar}`);

    if (nameError) {
      nameHintLabel.setContent(`{red-fg}${icons.failed} ${nameError}{/red-fg}`);
    } else if (nameBuffer) {
      nameHintLabel.setContent(`{gray-fg}Press {/gray-fg}{green-fg}Enter{/green-fg}{gray-fg} to confirm{/gray-fg}`);
    } else {
      nameHintLabel.setContent(`{gray-fg}Default: my-fullstack-app{/gray-fg}`);
    }
  }

  // ── Choice list render ──────────────────────────────────────────
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

  // ── Preview panel ───────────────────────────────────────────────
  function renderPreview() {
    const choices = getChoices();
    const hoveredChoice = choices[selectedIndex];
    const hoveredValue = typeof hoveredChoice === 'string' ? hoveredChoice : hoveredChoice?.value;

    const effectiveFrontend = step === 'frontend' ? hoveredValue : selections.frontend;
    const effectiveBackend  = step === 'backend'  ? hoveredValue : selections.backend;
    const effectiveDatabase = step === 'database' ? hoveredValue : selections.database;

    previewHeader.setContent('{gray-fg}// Current Stack Configuration{/gray-fg}');

    let content = '';

    content += '{white-fg}{bold}STACK CONFIGURATION{/bold}{/white-fg}\n';
    content += '{gray-fg}───────────────────────{/gray-fg}\n';

    // Project name
    content += `{cyan-fg}project:{/cyan-fg}   `;
    if (selections.projectName || nameBuffer) {
      content += `{green-fg}${selections.projectName || nameBuffer}{/green-fg}\n`;
    } else {
      content += `{yellow-fg}<enter name>{/yellow-fg}\n`;
    }

    // Frontend
    if (effectiveFrontend) {
      content += `{cyan-fg}frontend:{/cyan-fg}  {green-fg}${getDisplayName(effectiveFrontend)}{/green-fg}\n`;
    } else {
      content += `{cyan-fg}frontend:{/cyan-fg}  {gray-fg}pending...{/gray-fg}\n`;
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

    // Preview package.json
    if (step === 'projectName') {
      content += '{gray-fg}// Start typing your project name{/gray-fg}\n';
      content += '{gray-fg}// Then pick your tech stack{/gray-fg}\n';
    } else {
      content += '{gray-fg}// frontend/package.json{/gray-fg}\n';
      content += '{\n';

      const pName = selections.projectName || 'my-app';
      content += `  {cyan-fg}"name"{/cyan-fg}: {yellow-fg}"${pName}"{/yellow-fg},\n`;
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
          content += `    {cyan-fg}"build"{/cyan-fg}: {yellow-fg}"vite build"{/yellow-fg}\n`;
        } else if (effectiveFrontend === 'svelte') {
          content += `    {cyan-fg}"dev"{/cyan-fg}: {yellow-fg}"vite dev"{/yellow-fg},\n`;
          content += `    {cyan-fg}"build"{/cyan-fg}: {yellow-fg}"vite build"{/yellow-fg}\n`;
        }
        content += `  },\n`;
        content += `  {cyan-fg}"dependencies"{/cyan-fg}: {\n`;
        if (effectiveFrontend === 'nextjs') {
          content += `    {cyan-fg}"next"{/cyan-fg}: {yellow-fg}"^14.0.0"{/yellow-fg},\n`;
          content += `    {cyan-fg}"react"{/cyan-fg}: {yellow-fg}"^18.2.0"{/yellow-fg}\n`;
        } else if (effectiveFrontend === 'react-vite') {
          content += `    {cyan-fg}"react"{/cyan-fg}: {yellow-fg}"^18.2.0"{/yellow-fg},\n`;
          content += `    {cyan-fg}"react-dom"{/cyan-fg}: {yellow-fg}"^18.2.0"{/yellow-fg}\n`;
        } else if (effectiveFrontend === 'svelte') {
          content += `    {cyan-fg}"svelte"{/cyan-fg}: {yellow-fg}"^4.0.0"{/yellow-fg}\n`;
        }
        content += `  }\n`;
      }
      content += '}\n';

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
        if (effectiveDatabase && effectiveDatabase !== 'none') {
          content += `,\n`;
          if (effectiveDatabase === 'postgres')  content += `    {cyan-fg}"pg"{/cyan-fg}: {yellow-fg}"^8.11.0"{/yellow-fg}`;
          if (effectiveDatabase === 'mongodb')   content += `    {cyan-fg}"mongoose"{/cyan-fg}: {yellow-fg}"^7.0.0"{/yellow-fg}`;
          if (effectiveDatabase === 'mysql')     content += `    {cyan-fg}"mysql2"{/cyan-fg}: {yellow-fg}"^3.6.0"{/yellow-fg}`;
          if (effectiveDatabase === 'supabase')  content += `    {cyan-fg}"@supabase/supabase-js"{/cyan-fg}: {yellow-fg}"^2.0.0"{/yellow-fg}`;
        }
        content += `\n  }\n}\n`;
      }
    }

    previewContent.setContent(content);
  }

  // ── Footer ──────────────────────────────────────────────────────
  function updateFooter() {
    let content = '';

    if (step === 'projectName') {
      content += `{green-fg}{bold} ← Backspace {/bold}{/green-fg}{gray-fg}Delete{/gray-fg}  `;
      content += `{green-fg}{bold} Enter {/bold}{/green-fg}{gray-fg}Confirm{/gray-fg}  `;
    } else {
      content += `{green-fg}{bold} ${icons.arrowUp}${icons.arrowDown} {/bold}{/green-fg}{gray-fg}Navigate{/gray-fg}  `;
      content += `{green-fg}{bold} Enter {/bold}{/green-fg}{gray-fg}Select{/gray-fg}  `;
      if (step !== 'frontend') {
        content += `{green-fg}{bold} ← {/bold}{/green-fg}{gray-fg}Back{/gray-fg}  `;
      } else {
        content += `{green-fg}{bold} ← {/bold}{/green-fg}{gray-fg}Back (name){/gray-fg}  `;
      }
    }

    content += `{green-fg}{bold} ESC {/bold}{/green-fg}{gray-fg}Quit{/gray-fg}`;
    footerContent.setContent(content);

    stepIndicator.setContent(
      `{gray-fg}Step {/gray-fg}{cyan-fg}${getStepNumber()}{/cyan-fg}{gray-fg}/${getTotalSteps()}{/gray-fg}`
    );
  }

  // ── Toggle panel visibility ─────────────────────────────────────
  function syncPanelVisibility() {
    if (step === 'projectName') {
      nameInputBox.show();
      nameHintLabel.show();
      choicesBox.hide();
      middlePanel.style.border = { fg: colors.secondary }; // cyan border for input step
    } else {
      nameInputBox.hide();
      nameHintLabel.hide();
      choicesBox.show();
      middlePanel.style.border = { fg: colors.primary }; // green border for choice steps
    }
  }

  function updateDisplay() {
    syncPanelVisibility();
    questionLabel.setContent(`{cyan-fg}{bold}${getQuestion()}{/bold}{/cyan-fg}`);
    updateFooter();
    renderSidebar();

    if (step === 'projectName') {
      renderNameInput();
    } else {
      renderChoices();
    }

    renderPreview();
    render();
  }

  // ================================================================
  // KEY HANDLERS
  // ================================================================

  // ── Activate / deactivate selection-mode key bindings ───────────
  // These helpers ensure we never double-bind or leave stale bindings.
  function bindSelectionKeys() {
    screen.key(['up', 'k'], handleUp);
    screen.key(['down', 'j'], handleDown);
    screen.key(['enter', 'space'], handleEnter);
    screen.key(['backspace', 'left'], handleBackKey);
    // During selection steps, 'q' can quit (safe — user isn't typing free text)
    screen.key(['q'], handleEscape);
  }

  function unbindSelectionKeys() {
    screen.unkey(['up', 'k'], handleUp);
    screen.unkey(['down', 'j'], handleDown);
    screen.unkey(['enter', 'space'], handleEnter);
    screen.unkey(['backspace', 'left'], handleBackKey);
    screen.unkey(['q'], handleEscape);
  }

  // ── Name input mode ─────────────────────────────────────────────
  // Uses screen.on('keypress') — NOT screen.key() — because screen.key()
  // only works for named keys, not for arbitrary typed characters.
  function handleNameChar(ch, key) {
    if (!isActive || step !== 'projectName') return;
    if (transitionLocked) return;

    const keyName = key?.name ?? '';

    if (keyName === 'enter' || keyName === 'return') {
      // Confirm name
      const trimmed = nameBuffer.trim() || 'my-fullstack-app';
      const err = validateName(trimmed);
      if (err) {
        nameError = err;
        updateDisplay();
        return;
      }
      nameError = '';
      nameBuffer = trimmed;
      selections.projectName = trimmed;
      step = 'frontend';
      selectedIndex = 0;

      // Lock transitions for a tick so the same Enter keypress
      // can't accidentally trigger handleEnter on the new step
      transitionLocked = true;

      // Switch from free-text input to list-navigation
      screen.removeListener('keypress', handleNameChar);
      bindSelectionKeys();

      updateDisplay();

      // Unlock on next tick — the Enter event is fully processed by then
      process.nextTick(() => { transitionLocked = false; });
      return;
    }

    if (keyName === 'escape') {
      handleEscape();
      return;
    }

    if (keyName === 'backspace' || keyName === 'delete') {
      nameBuffer = nameBuffer.slice(0, -1);
      nameError = '';
      updateDisplay();
      return;
    }

    // Accept printable characters matching valid project name chars
    if (ch && ch.length === 1 && /[a-zA-Z0-9_-]/.test(ch)) {
      if (nameBuffer.length < 50) {
        nameBuffer += ch;
        nameError = '';
        updateDisplay();
      }
    }
  }

  // ── Selection mode ───────────────────────────────────────────────
  function handleUp() {
    if (!isActive || step === 'projectName' || transitionLocked) return;
    const choices = getChoices();
    selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : choices.length - 1;
    updateDisplay();
  }

  function handleDown() {
    if (!isActive || step === 'projectName' || transitionLocked) return;
    const choices = getChoices();
    selectedIndex = selectedIndex < choices.length - 1 ? selectedIndex + 1 : 0;
    updateDisplay();
  }

  function handleEnter() {
    if (!isActive || step === 'projectName' || transitionLocked) return;
    handleSelect();
  }

  function handleBackKey() {
    if (!isActive || step === 'projectName' || transitionLocked) return;
    handleBack();
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
      // Cleanup all key listeners
      unbindSelectionKeys();
      screen.unkey(['escape'], handleEscape);
      screen.removeListener('keypress', handleNameChar);
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
    } else if (step === 'frontend') {
      // Go back to project name step
      selections.projectName = '';
      step = 'projectName';
      nameBuffer = '';
      nameError = '';

      // Switch from list-navigation back to free-text input
      unbindSelectionKeys();
      screen.on('keypress', handleNameChar);
    }

    updateDisplay();
  }

  function handleEscape() {
    if (!isActive) return;
    isActive = false;
    if (animationTimer) clearInterval(animationTimer);
    // Remove every listener we ever registered
    unbindSelectionKeys();
    screen.unkey(['escape'], handleEscape);
    screen.removeListener('keypress', handleNameChar);
    container.destroy();
    render();
    onCancel();
  }

  // ================================================================
  // REGISTER INITIAL KEY HANDLERS
  // ================================================================
  // Start in project name mode:
  //   • screen.on('keypress') for typed characters
  //   • screen.key(['escape']) for quit (NO 'q' — user might type 'q')
  screen.on('keypress', handleNameChar);
  screen.key(['escape'], handleEscape);

  // ================================================================
  // CURSOR BLINK ANIMATION
  // ================================================================
  animationTimer = setInterval(() => {
    if (!isActive) return;
    cursorFrame++;

    if (step === 'projectName') {
      nameCursorVisible = !nameCursorVisible;
      renderNameInput();
    } else {
      renderChoices();
    }
    render();
  }, 300);

  // Initial render
  updateDisplay();
  screen.render();
}
