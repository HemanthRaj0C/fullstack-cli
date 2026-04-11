/**
 * Widget Factories - Reusable blessed widget creators
 */

import blessed from 'blessed';
import { colors, boxStyles, listStyles } from './theme.js';

/**
 * Create a bordered box
 */
export function createBox(options = {}) {
  const defaults = {
    border: { type: 'line' },
    style: {
      border: { fg: colors.primary },
      label: { fg: colors.secondary, bold: true },
    },
  };

  return blessed.box({
    ...defaults,
    ...options,
    style: { ...defaults.style, ...options.style },
  });
}

/**
 * Create a header bar
 */
export function createHeader(parent, title, subtitle = '') {
  const content = subtitle 
    ? `{white-fg}{bold}${title}{/bold}{/white-fg} {gray-fg}:: ${subtitle}{/gray-fg}`
    : `{white-fg}{bold}${title}{/bold}{/white-fg}`;

  return blessed.box({
    parent,
    top: 0,
    left: 0,
    width: '100%',
    height: 3,
    content: content,
    align: 'center',
    valign: 'middle',
    tags: true,
    border: { type: 'line' },
    style: {
      border: { fg: colors.primary },
    },
  });
}

/**
 * Create a footer status bar
 */
export function createFooter(parent, keys = []) {
  const content = keys.map(k => 
    `{white-fg}{bold} ${k.key} {/bold}{/white-fg}{gray-fg}${k.action}{/gray-fg}`
  ).join('  ');

  return blessed.box({
    parent,
    bottom: 0,
    left: 0,
    width: '100%',
    height: 3,
    content: content,
    align: 'left',
    valign: 'middle',
    tags: true,
    padding: { left: 1 },
    border: { type: 'line' },
    style: {
      border: { fg: colors.muted },
    },
  });
}

/**
 * Create an interactive list
 */
export function createList(options = {}) {
  return blessed.list({
    mouse: true,
    keys: true,
    vi: true,
    border: { type: 'line' },
    scrollbar: {
      ch: ' ',
      style: { bg: colors.primary },
    },
    style: {
      border: { fg: colors.primary },
      selected: {
        fg: 'black',
        bg: colors.primary,
        bold: true,
      },
      item: {
        fg: colors.text,
      },
      label: {
        fg: colors.secondary,
        bold: true,
      },
    },
    ...options,
  });
}

/**
 * Create a text display box (for logs, preview, etc.)
 */
export function createTextBox(options = {}) {
  return blessed.box({
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      ch: ' ',
      style: { bg: colors.muted },
    },
    mouse: true,
    keys: true,
    vi: true,
    border: { type: 'line' },
    style: {
      border: { fg: colors.muted },
      label: { fg: colors.secondary, bold: true },
    },
    tags: true,
    ...options,
  });
}

/**
 * Create a log box with auto-scroll
 */
export function createLogBox(options = {}) {
  const box = blessed.log({
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      ch: ' ',
      style: { bg: colors.muted },
    },
    mouse: true,
    keys: true,
    border: { type: 'line' },
    style: {
      border: { fg: colors.muted },
      label: { fg: colors.secondary, bold: true },
    },
    tags: true,
    ...options,
  });

  return box;
}

/**
 * Create a progress bar
 */
export function createProgressBar(parent, options = {}) {
  return blessed.progressbar({
    parent,
    orientation: 'horizontal',
    filled: 0,
    ch: '#',
    pch: '-',
    border: { type: 'line' },
    style: {
      bar: { bg: colors.primary },
      border: { fg: colors.muted },
    },
    ...options,
  });
}

/**
 * Create a simple text label
 */
export function createLabel(parent, options = {}) {
  return blessed.text({
    parent,
    tags: true,
    ...options,
  });
}
