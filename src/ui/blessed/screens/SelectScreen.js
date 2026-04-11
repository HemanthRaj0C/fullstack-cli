/**
 * Select Screen - Framework selection wizard with cyberpunk-style layout
 * Features: Left sidebar navigation, dynamic preview, animated cursor
 * Step 0: project name input (themed), then frontend → backend → database
 */

import blessed from 'blessed';
import fs from 'fs-extra';
import path from 'path';
import { colors, icons, labels } from '../theme.js';
import { getScreen, render } from '../screen.js';
import { getFrontendChoices, getBackendChoices, getDatabaseChoices } from '../../../utils/stack.js';

// Animation frames
const CURSOR_FRAMES = [icons.arrow, '▹', icons.arrow, '▹'];

// Fixed widths
const SIDEBAR_WIDTH = 20;
const RED_BRIGHT = '#ff4d4d';
const RED_DIM = '#c24b4b';
const RED_SOFT = '#ff8a8a';
const WHITE = '#ffffff';

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
    overwriteExisting: false,
    overwriteConfirmedAt: null,
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
  let overwriteDialog = null;
  let pendingOverwrite = null;
  let escapeKeySuspended = false;

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
    content: `{#ffffff-fg}{bold} ${labels.mainHeader} {/bold}{/#ffffff-fg}{#ff4d4d-fg}{bold} :: ${labels.scaffoldWizard} {/bold}{/#ff4d4d-fg}`,
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
    width: middlePanelWidth - 4,
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
    width: middlePanelWidth - 8,
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
    wrap: true,
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

  function ellipsize(value, maxLen) {
    const text = String(value ?? '').replace(/\s+/g, ' ').trim();
    if (maxLen <= 0) return '';
    if (text.length <= maxLen) return text;
    if (maxLen <= 3) return '.'.repeat(maxLen);
    return text.slice(0, maxLen - 3) + '...';
  }

  function tailEllipsize(value, maxLen) {
    const text = String(value ?? '');
    if (maxLen <= 0) return '';
    if (text.length <= maxLen) return text;
    if (maxLen <= 3) return '.'.repeat(maxLen);
    return '...' + text.slice(-(maxLen - 3));
  }

  function proceedFromProjectName(trimmed, overwriteExisting = false) {
    pendingOverwrite = null;
    selections.overwriteExisting = overwriteExisting;
    selections.overwriteConfirmedAt = overwriteExisting ? Date.now() : null;
    nameError = '';
    nameBuffer = trimmed;
    selections.projectName = trimmed;
    step = 'frontend';
    selectedIndex = 0;

    // Lock transitions for a tick so the same Enter keypress
    // can't accidentally trigger handleEnter on the new step.
    transitionLocked = true;

    // Switch from free-text input to list-navigation.
    screen.removeListener('keypress', handleNameChar);
    bindSelectionKeys();

    updateDisplay();
    process.nextTick(() => { transitionLocked = false; });
  }

  function closeOverwriteDialog() {
    if (overwriteDialog) {
      overwriteDialog.destroy();
      overwriteDialog = null;
    }
    screen.unkey(['y', 'Y'], handleOverwriteConfirm);
    screen.unkey(['enter'], handleOverwriteCancel);
    screen.unkey(['n', 'N'], handleOverwriteCancel);
    screen.unkey(['escape'], handleOverwriteCancel);
    if (escapeKeySuspended) {
      screen.key(['escape'], handleEscape);
      escapeKeySuspended = false;
    }
    render();
  }

  function showOverwriteDialog(projectName) {
    closeOverwriteDialog();

    pendingOverwrite = { projectName };

    const dialogWidth = Math.max(44, Math.min(68, screenWidth - 6));
    const dialogHeight = 9;
    const safeName = ellipsize(projectName, dialogWidth - 8);

    overwriteDialog = blessed.box({
      parent: container,
      top: Math.floor((screenHeight - dialogHeight) / 2),
      left: Math.floor((screenWidth - dialogWidth) / 2),
      width: dialogWidth,
      height: dialogHeight,
      border: { type: 'line' },
      style: {
        border: { fg: colors.error },
      },
      tags: true,
      padding: { left: 2, right: 2, top: 1 },
    });

    blessed.text({
      parent: overwriteDialog,
      top: 0,
      left: 0,
      width: dialogWidth - 6,
      tags: true,
      content:
        `{#ff0000-fg}{bold}${icons.warning} Directory already exists{/bold}{/#ff0000-fg}\n` +
        `{#ffffff-fg}${safeName}{/#ffffff-fg}\n\n` +
        `{#ffffff-fg}{bold}Y{/bold}{/#ffffff-fg} {gray-fg}Overwrite{/gray-fg}   ` +
        `{#ffffff-fg}{bold}N{/bold}{/#ffffff-fg} {gray-fg}Choose another name{/gray-fg}\n` +
        `{gray-fg}Enter = cancel{/gray-fg}`,
    });

    screen.key(['y', 'Y'], handleOverwriteConfirm);
    screen.key(['enter'], handleOverwriteCancel);
    screen.key(['n', 'N'], handleOverwriteCancel);
    screen.unkey(['escape'], handleEscape);
    escapeKeySuspended = true;
    screen.key(['escape'], handleOverwriteCancel);
    render();
  }

  function handleOverwriteConfirm() {
    if (!isActive || step !== 'projectName' || !pendingOverwrite) return;
    const { projectName } = pendingOverwrite;
    closeOverwriteDialog();
    proceedFromProjectName(projectName, true);
  }

  function handleOverwriteCancel() {
    if (!isActive || step !== 'projectName') return;
    closeOverwriteDialog();
    pendingOverwrite = null;
    selections.overwriteExisting = false;
    selections.overwriteConfirmedAt = null;
    nameError = 'Please choose a different project name.';
    updateDisplay();
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
      let labelColor = RED_DIM;
      let iconColor  = RED_DIM;

      if (isCurrentStep) {
        iconColor  = RED_BRIGHT;
        labelColor = WHITE;
        icon = icons.pointer;
      } else if (isDone) {
        iconColor  = RED_SOFT;
        labelColor = WHITE;
        icon = icons.done;
      }

      content += `{${iconColor}-fg}${icon}{/${iconColor}-fg} {${labelColor}-fg}${cat.label}{/${labelColor}-fg}`;

      // Show chosen value under category
      const sidebarValueWidth = SIDEBAR_WIDTH - 7;
      if (cat.id === 'projectName' && selections.projectName) {
        content += `\n  {gray-fg}└{/gray-fg} {white-fg}${ellipsize(selections.projectName, sidebarValueWidth)}{/white-fg}`;
      } else if (cat.id === 'frontend' && selections.frontend) {
        content += `\n  {gray-fg}└{/gray-fg} {white-fg}${ellipsize(getDisplayName(selections.frontend), sidebarValueWidth)}{/white-fg}`;
      } else if (cat.id === 'backend' && selections.backend) {
        content += `\n  {gray-fg}└{/gray-fg} {white-fg}${ellipsize(getDisplayName(selections.backend), sidebarValueWidth)}{/white-fg}`;
      } else if (cat.id === 'database' && selections.database) {
        content += `\n  {gray-fg}└{/gray-fg} {white-fg}${ellipsize(getDisplayName(selections.database), sidebarValueWidth)}{/white-fg}`;
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
    const displayText = tailEllipsize(nameBuffer, Math.max(12, middlePanelWidth - 10));
    const cursorChar = nameCursorVisible ? '{white-fg}▌{/white-fg}' : ' ';

    nameInputText.setContent(`{white-fg}${displayText}{/white-fg}${cursorChar}`);

    if (nameError) {
      nameHintLabel.setContent(`{red-fg}${icons.failed} ${nameError}{/red-fg}`);
    } else if (nameBuffer) {
      nameHintLabel.setContent(`{gray-fg}Press {/gray-fg}{white-fg}Enter{/white-fg}{gray-fg} to confirm{/gray-fg}`);
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
        content += `{#ff4d4d-fg}${cursor}{/#ff4d4d-fg} {#ffffff-fg}{bold}${name}{/bold}{/#ffffff-fg}\n`;
      } else {
        content += `  {#c24b4b-fg}${name}{/#c24b4b-fg}\n`;
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
    const previewValueWidth = Math.max(10, rightPanelWidth - 16);

    content += '{white-fg}{bold}STACK CONFIGURATION{/bold}{/white-fg}\n';
    content += '{gray-fg}───────────────────────{/gray-fg}\n';

    // Project name
    content += `{red-fg}project:{/red-fg}   `;
    if (selections.projectName || nameBuffer) {
      content += `{red-fg}${ellipsize(selections.projectName || nameBuffer, previewValueWidth)}{/red-fg}\n`;
    } else {
      content += `{gray-fg}<enter name>{/gray-fg}\n`;
    }

    // Frontend
    if (effectiveFrontend) {
      content += `{red-fg}frontend:{/red-fg}  {red-fg}${ellipsize(getDisplayName(effectiveFrontend), previewValueWidth)}{/red-fg}\n`;
    } else {
      content += `{red-fg}frontend:{/red-fg}  {gray-fg}pending...{/gray-fg}\n`;
    }

    // Backend
    if (effectiveBackend) {
      content += `{red-fg}backend:{/red-fg}   {red-fg}${ellipsize(getDisplayName(effectiveBackend), previewValueWidth)}{/red-fg}\n`;
    } else if (selections.frontend) {
      content += `{red-fg}backend:{/red-fg}   {gray-fg}pending...{/gray-fg}\n`;
    } else {
      content += `{red-fg}backend:{/red-fg}   {gray-fg}---{/gray-fg}\n`;
    }

    // Database
    if (effectiveDatabase) {
      content += `{red-fg}database:{/red-fg}  {red-fg}${ellipsize(getDisplayName(effectiveDatabase), previewValueWidth)}{/red-fg}\n`;
    } else if (selections.backend) {
      content += `{red-fg}database:{/red-fg}  {gray-fg}pending...{/gray-fg}\n`;
    } else {
      content += `{red-fg}database:{/red-fg}  {gray-fg}---{/gray-fg}\n`;
    }

    content += '\n';

    // Preview package.json
    if (step === 'projectName') {
      content += '{gray-fg}// Start typing your project name{/gray-fg}\n';
      content += '{gray-fg}// Then pick your tech stack{/gray-fg}\n';
    } else {
      content += '{gray-fg}// frontend/package.json{/gray-fg}\n';
      content += '{\n';

      const pName = ellipsize(selections.projectName || 'my-app', Math.max(8, rightPanelWidth - 18));
      content += `  {red-fg}"name"{/red-fg}: {gray-fg}"${pName}"{/gray-fg},\n`;
      content += `  {red-fg}"version"{/red-fg}: {gray-fg}"0.1.0"{/gray-fg},\n`;
      content += `  {red-fg}"private"{/red-fg}: {gray-fg}true{/gray-fg},\n`;

      if (effectiveFrontend) {
        content += `  {red-fg}"scripts"{/red-fg}: {\n`;
        if (effectiveFrontend === 'nextjs') {
          content += `    {red-fg}"dev"{/red-fg}: {gray-fg}"next dev"{/gray-fg},\n`;
          content += `    {red-fg}"build"{/red-fg}: {gray-fg}"next build"{/gray-fg},\n`;
          content += `    {red-fg}"start"{/red-fg}: {gray-fg}"next start"{/gray-fg}\n`;
        } else if (effectiveFrontend === 'react-vite') {
          content += `    {red-fg}"dev"{/red-fg}: {gray-fg}"vite"{/gray-fg},\n`;
          content += `    {red-fg}"build"{/red-fg}: {gray-fg}"vite build"{/gray-fg}\n`;
        } else if (effectiveFrontend === 'svelte') {
          content += `    {red-fg}"dev"{/red-fg}: {gray-fg}"vite dev"{/gray-fg},\n`;
          content += `    {red-fg}"build"{/red-fg}: {gray-fg}"vite build"{/gray-fg}\n`;
        }
        content += `  },\n`;
        content += `  {red-fg}"dependencies"{/red-fg}: {\n`;
        if (effectiveFrontend === 'nextjs') {
          content += `    {red-fg}"next"{/red-fg}: {gray-fg}"^14.0.0"{/gray-fg},\n`;
          content += `    {red-fg}"react"{/red-fg}: {gray-fg}"^18.2.0"{/gray-fg}\n`;
        } else if (effectiveFrontend === 'react-vite') {
          content += `    {red-fg}"react"{/red-fg}: {gray-fg}"^18.2.0"{/gray-fg},\n`;
          content += `    {red-fg}"react-dom"{/red-fg}: {gray-fg}"^18.2.0"{/gray-fg}\n`;
        } else if (effectiveFrontend === 'svelte') {
          content += `    {red-fg}"svelte"{/red-fg}: {gray-fg}"^4.0.0"{/gray-fg}\n`;
        }
        content += `  }\n`;
      }
      content += '}\n';

      if (effectiveBackend && effectiveBackend !== 'nextjs-api') {
        content += '\n{gray-fg}// backend/package.json{/gray-fg}\n';
        content += '{\n';
        content += `  {red-fg}"name"{/red-fg}: {gray-fg}"backend"{/gray-fg},\n`;
        content += `  {red-fg}"type"{/red-fg}: {gray-fg}"module"{/gray-fg},\n`;
        content += `  {red-fg}"dependencies"{/red-fg}: {\n`;
        if (effectiveBackend === 'express') {
          content += `    {red-fg}"express"{/red-fg}: {gray-fg}"^4.18.0"{/gray-fg},\n`;
          content += `    {red-fg}"cors"{/red-fg}: {gray-fg}"^2.8.5"{/gray-fg}`;
        } else if (effectiveBackend === 'fastify') {
          content += `    {red-fg}"fastify"{/red-fg}: {gray-fg}"^4.0.0"{/gray-fg},\n`;
          content += `    {red-fg}"@fastify/cors"{/red-fg}: {gray-fg}"^8.0.0"{/gray-fg}`;
        } else if (effectiveBackend === 'fastapi') {
          content += `    {gray-fg}# Python backend{/gray-fg}\n`;
          content += `    {red-fg}"fastapi"{/red-fg}: {gray-fg}"latest"{/gray-fg}`;
        }
        if (effectiveDatabase && effectiveDatabase !== 'none') {
          content += `,\n`;
          if (effectiveDatabase === 'postgres')  content += `    {red-fg}"pg"{/red-fg}: {gray-fg}"^8.11.0"{/gray-fg}`;
          if (effectiveDatabase === 'mongodb')   content += `    {red-fg}"mongoose"{/red-fg}: {gray-fg}"^7.0.0"{/gray-fg}`;
          if (effectiveDatabase === 'mysql')     content += `    {red-fg}"mysql2"{/red-fg}: {gray-fg}"^3.6.0"{/gray-fg}`;
          if (effectiveDatabase === 'supabase')  content += `    {red-fg}"@supabase/supabase-js"{/red-fg}: {gray-fg}"^2.0.0"{/gray-fg}`;
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
      content += `{#ff4d4d-fg}{bold} ← Backspace {/bold}{/#ff4d4d-fg}{#ffffff-fg}Delete{/#ffffff-fg}  `;
      content += `{#ff4d4d-fg}{bold} Enter {/bold}{/#ff4d4d-fg}{#ffffff-fg}Confirm{/#ffffff-fg}  `;
    } else {
      content += `{#ff4d4d-fg}{bold} ${icons.arrowUp}${icons.arrowDown} {/bold}{/#ff4d4d-fg}{#ffffff-fg}Navigate{/#ffffff-fg}  `;
      content += `{#ff4d4d-fg}{bold} Enter {/bold}{/#ff4d4d-fg}{#ffffff-fg}Select{/#ffffff-fg}  `;
      if (step !== 'frontend') {
        content += `{#ff4d4d-fg}{bold} ← {/bold}{/#ff4d4d-fg}{#ffffff-fg}Back{/#ffffff-fg}  `;
      } else {
        content += `{#ff4d4d-fg}{bold} ← {/bold}{/#ff4d4d-fg}{#ffffff-fg}Back (name){/#ffffff-fg}  `;
      }
    }

    content += `{#ff4d4d-fg}{bold} ESC {/bold}{/#ff4d4d-fg}{#ffffff-fg}Quit{/#ffffff-fg}`;
    footerContent.setContent(content);

    stepIndicator.setContent(
      `{#ffffff-fg}Step {/#ffffff-fg}{#ff4d4d-fg}${getStepNumber()}{/#ff4d4d-fg}{#ffffff-fg}/${getTotalSteps()}{/#ffffff-fg}`
    );
  }

  // ── Toggle panel visibility ─────────────────────────────────────
  function syncPanelVisibility() {
    if (step === 'projectName') {
      nameInputBox.show();
      nameHintLabel.show();
      choicesBox.hide();
      middlePanel.style.border = { fg: colors.secondary }; // white border for input step
    } else {
      nameInputBox.hide();
      nameHintLabel.hide();
      choicesBox.show();
      middlePanel.style.border = { fg: colors.primary }; // red border for choice steps
    }
  }

  function updateDisplay() {
    syncPanelVisibility();
    questionLabel.setContent(`{red-fg}{bold}${getQuestion()}{/bold}{/red-fg}`);
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
    if (overwriteDialog) return;
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

      // Always reset overwrite state until user explicitly confirms in popup.
      selections.overwriteExisting = false;
      selections.overwriteConfirmedAt = null;

      // Ask for explicit overwrite confirmation in a popup
      if (fs.existsSync(path.join(process.cwd(), trimmed))) {
        showOverwriteDialog(trimmed);
        return;
      }

      proceedFromProjectName(trimmed, false);
      return;
    }

    if (keyName === 'escape') {
      handleEscape();
      return;
    }

    if (keyName === 'backspace' || keyName === 'delete') {
      nameBuffer = nameBuffer.slice(0, -1);
      if (nameError) nameError = '';
      updateDisplay();
      return;
    }

    // Accept printable characters matching valid project name chars
    if (ch && ch.length === 1 && /[a-zA-Z0-9_-]/.test(ch)) {
      if (nameBuffer.length < 50) {
        nameBuffer += ch;
        if (nameError) nameError = '';
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
      selections.overwriteExisting = false;
      selections.overwriteConfirmedAt = null;
      step = 'projectName';
      nameBuffer = '';
      nameError = '';
      pendingOverwrite = null;
      closeOverwriteDialog();

      // Switch from list-navigation back to free-text input
      unbindSelectionKeys();
      screen.on('keypress', handleNameChar);
    }

    updateDisplay();
  }

  function handleEscape() {
    if (!isActive) return;
    if (overwriteDialog && step === 'projectName') {
      handleOverwriteCancel();
      return;
    }
    isActive = false;
    if (animationTimer) clearInterval(animationTimer);
    // Remove every listener we ever registered
    unbindSelectionKeys();
    closeOverwriteDialog();
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
