/**
 * Cyberpunk Terminal Theme
 * Color palette and styling constants for the TUI
 */

// Cyberpunk color palette
export const colors = {
  primary: 'green',
  secondary: 'cyan',
  accent: 'magenta',
  warning: 'yellow',
  error: 'red',
  success: 'green',
  muted: 'gray',
  text: 'white',
  dim: 'gray',
};

// Box drawing characters
export const box = {
  // Single line
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',
  // Double line
  dTopLeft: '╔',
  dTopRight: '╗',
  dBottomLeft: '╚',
  dBottomRight: '╝',
  dHorizontal: '═',
  dVertical: '║',
  // Title style (+ dashes)
  titleLeft: '+--',
  titleRight: '--+',
  // Corners for title boxes
  tl: '+',
  tr: '+',
  bl: '+',
  br: '+',
  h: '-',
  v: '|',
};

// Progress bar characters
export const progressChars = {
  filled: '#',
  empty: '.',
  leftBracket: '[',
  rightBracket: ']',
  // Alternative style
  filledBlock: '█',
  emptyBlock: '░',
  // Compact
  filledDot: '●',
  emptyDot: '○',
};

// Status indicators
export const statusIcons = {
  pending: '○',
  running: '◐',
  done: '●',
  failed: '✗',
  success: '✓',
  arrow: '←',
  bullet: '▸',
  radioOn: '(x)',
  radioOff: '( )',
  checkOn: '[x]',
  checkOff: '[ ]',
};

// Spinner frames for animations
export const spinnerFrames = ['◐', '◓', '◑', '◒'];

// Layout constants
export const layout = {
  padding: 1,
  gap: 1,
  borderPadding: 1,
  maxLogLines: 500,
  logHeight: 8,
  previewWidth: 50,
};

// ASCII art logo
export const logo = `
 ██████╗██████╗ ███████╗ █████╗ ████████╗███████╗      ███████╗███████╗
██╔════╝██╔══██╗██╔════╝██╔══██╗╚══██╔══╝██╔════╝      ██╔════╝██╔════╝
██║     ██████╔╝█████╗  ███████║   ██║   █████╗  █████╗█████╗  ███████╗
██║     ██╔══██╗██╔══╝  ██╔══██║   ██║   ██╔══╝  ╚════╝██╔══╝  ╚════██║
╚██████╗██║  ██║███████╗██║  ██║   ██║   ███████╗      ██║     ███████║
 ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝      ╚═╝     ╚══════╝
`;

// Compact logo for smaller terminals
export const logoCompact = `
┌─────────────────────────────────────────────────┐
│   ___ ___ ___   _ _____ ___   ___ ___    ___ _  │
│  / __| _ \\ __| /_\\_   _| __| | __/ __|  / __| | │
│ | (__|   / _| / _ \\| | | _|  | _|\\__ \\ | (__| |_│
│  \\___|_|_\\___|_/ \\_\\_| |___| |_| |___/  \\___|___|│
└─────────────────────────────────────────────────┘
`;

// Simple ASCII logo (most compatible)
export const logoSimple = `
  ___ ___  ___   _ _____ ___   ___ ___    ___ _    ___ 
 / __| _ \\| __| /_\\_   _| __| | __/ __|  / __| |  |_ _|
| (__|   /| _| / _ \\| | | _|  | _|\\__ \\ | (__| |__ | | 
 \\___|_|_\\|___/_/ \\_\\_| |___| |_| |___/  \\___|____|___|
`;

// Boot messages
export const bootMessages = [
  { text: 'INITIALIZING CORE...', status: 'OK' },
  { text: 'MOUNTING VFS...', status: 'OK' },
  { text: 'LOADING DEPENDENCIES...', status: 'DONE' },
  { text: 'ESTABLISHING UPLINK...', status: 'CONNECTED' },
];

// Tagline
export const tagline = 'High-performance scaffolding for the modern web.';
export const version = 'v1.1.1-stable';

// Key bindings display
export const keyBindings = {
  navigate: '↑↓ Navigate',
  select: '⏎ Select',
  quit: 'ESC Quit',
  copy: 'c Copy',
  help: '? Help',
};

// Helper to create a horizontal line
export function createLine(width, char = box.h) {
  return char.repeat(width);
}

// Helper to create a title bar
export function createTitleBar(title, width, style = 'default') {
  const titleText = ` ${title} `;
  const padding = width - titleText.length - 6; // 6 = "+--" + "--+"
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  
  return `+--${'-'.repeat(leftPad)}${titleText}${'-'.repeat(rightPad)}--+`;
}

// Helper to pad string to width
export function padString(str, width, align = 'left') {
  const len = str.length;
  if (len >= width) return str.slice(0, width);
  
  const padding = width - len;
  if (align === 'center') {
    const left = Math.floor(padding / 2);
    const right = padding - left;
    return ' '.repeat(left) + str + ' '.repeat(right);
  } else if (align === 'right') {
    return ' '.repeat(padding) + str;
  }
  return str + ' '.repeat(padding);
}

// Helper to create progress bar string
export function createProgressBar(percent, width = 30) {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return `[ ${progressChars.filled.repeat(filled)}${progressChars.empty.repeat(empty)} ] ${percent}%`;
}

// Helper to get status color
export function getStatusColor(status) {
  switch (status) {
    case 'OK':
    case 'DONE':
    case 'CONNECTED':
    case 'done':
    case 'success':
      return colors.success;
    case 'running':
    case 'RUNNING':
      return colors.warning;
    case 'error':
    case 'failed':
    case 'FAILED':
      return colors.error;
    default:
      return colors.muted;
  }
}
