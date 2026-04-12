/**
 * Blessed Theme - Cyberpunk Terminal Styling with Nerd Font Icons
 */

// Import figures for cross-platform icons
import figures from 'figures';

// Color palette — High-contrast red/white theme
export const colors = {
  primary: '#ff4d4d',
  secondary: '#ffffff',
  accent: '#ff8a8a',
  warning: '#ff7a7a',
  error: '#ff0000',
  success: '#ff4d4d',
  muted: '#7a7a7a',
  text: '#ffffff',
  bg: 'black',
};

// Nerd Font / Unicode icons for rich UI
export const icons = {
  // Status indicators
  pending: '○',
  running: '◐',
  done: '●',
  success: '✓',
  failed: '✗',
  warning: '⚠',
  error: '✗',
  
  // Navigation
  arrow: '▸',
  arrowRight: '→',
  arrowLeft: '←',
  arrowUp: '↑',
  arrowDown: '↓',
  pointer: '❯',
  
  // Selection
  selected: '◉',
  unselected: '○',
  checkbox: '☐',
  checkboxChecked: '☑',
  radioOn: '◉',
  radioOff: '○',
  
  // Categories / Items
  folder: '📁',
  file: '📄',
  package: '📦',
  rocket: '🚀',
  gear: '⚙',
  star: '★',
  heart: '♥',
  bolt: '⚡',
  fire: '🔥',
  sparkles: '✨',
  party: '🎉',
  
  // Tech icons (using unicode approximations)
  frontend: '◆',
  backend: '◇',
  database: '⬡',
  api: '⬢',
  
  // Progress
  spinner: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  progressFilled: '█',
  progressEmpty: '░',
  progressEdge: ['░', '▒', '▓', '█'],
  
  // Decorative
  bullet: '•',
  line: '│',
  corner: '└',
  tee: '├',
  cross: '┼',
  
  // Box drawing (single line)
  boxTopLeft: '┌',
  boxTopRight: '┐',
  boxBottomLeft: '└',
  boxBottomRight: '┘',
  boxHorizontal: '─',
  boxVertical: '│',
};

// Border styles
export const borders = {
  line: 'line',
  bg: 'black',
  fg: 'red',
};

// Box styling presets
export const boxStyles = {
  default: {
    border: { type: 'line' },
    style: {
      border: { fg: colors.primary },
      label: { fg: colors.secondary, bold: true },
    },
  },
  muted: {
    border: { type: 'line' },
    style: {
      border: { fg: colors.muted },
      label: { fg: colors.muted },
    },
  },
  highlight: {
    border: { type: 'line' },
    style: {
      border: { fg: colors.secondary },
      label: { fg: colors.secondary, bold: true },
    },
  },
};

// List styling
export const listStyles = {
  default: {
    style: {
      fg: colors.text,
      bg: colors.bg,
      selected: {
        fg: 'black',
        bg: colors.primary,
        bold: true,
      },
      item: {
        fg: colors.text,
      },
    },
  },
};

// ASCII Logo
export const logo = `
   ██████╗███████╗      ██████╗██╗     ██╗
  ██╔════╝██╔════╝     ██╔════╝██║     ██║
  █████╗  ███████╗     ██║     ██║     ██║
  ██╔══╝  ╚════██║     ██║     ██║     ██║
  ██║     ███████║     ╚██████╗███████╗██║
  ╚═╝     ╚══════╝      ╚═════╝╚══════╝╚═╝
`;

// Boot messages
export const bootMessages = [
  { text: 'Warming up the engines...', status: 'OK' },
  { text: 'Loading magic dependencies...', status: 'OK' },
  { text: 'Brewing some fresh code...', status: 'DONE' },
  { text: 'Connecting to the matrix...', status: 'CONNECTED' },
];

// App info - more fun and casual
export const appInfo = {
  name: 'fs-cli',
  version: 'v1.1.1',
  tagline: 'Scaffolding so fast, it feels illegal.',
  repo: 'github.com/HemanthRaj0C/fullstack-cli',
};

// UI Labels - fun and casual naming
export const labels = {
  // Headers
  mainHeader: 'fs-cli',
  scaffoldWizard: 'Stack Picker',
  generatingProject: 'Cooking your project...',
  projectCreated: 'Boom! Project ready',
  
  // Panels
  steps: 'Progress',
  preview: 'Sneak Peek',
  repoMetrics: 'Community Love',
  nextSteps: 'What now?',
  
  // Steps
  preflightChecks: 'Checking stuff',
  frontendSetup: 'Frontend magic',
  backendSetup: 'Backend sorcery', 
  finalSetup: 'Final touches',
  
  // Categories
  frontend: 'Frontend',
  language: 'Language',
  backend: 'Backend',
  database: 'Database',
  
  // Stats
  npmDownloads: 'Weekly downloads',
  githubStats: 'GitHub vibes',
  stars: 'Stars',
  forks: 'Forks',
  synced: 'Live',
  loading: 'Fetching...',
  
  // Actions
  starPrompt: 'Enjoying this? Show some love:',
  exitHint: 'Exit',
  navigateHint: 'Navigate',
  selectHint: 'Select',
  backHint: 'Back',
  
  // Completion
  successBanner: 'Your project is ready to rock!',
  projectStructure: 'What you got:',
};

// Key bindings
export const keyBindings = {
  up: ['up', 'k'],
  down: ['down', 'j'],
  select: ['enter', 'space'],
  quit: ['escape', 'q', 'C-c'],
  back: ['backspace', 'h'],
};

// Progress bar characters
export const progressChars = {
  filled: '█',
  empty: '░',
  left: '[',
  right: ']',
};

// Helper: get status color
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

// Helper: create progress bar string
export function createProgressBar(percent, width = 30) {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return `${progressChars.left}${progressChars.filled.repeat(filled)}${progressChars.empty.repeat(empty)}${progressChars.right} ${percent}%`;
}

// Helper: get animated spinner frame
export function getSpinnerFrame(frameIndex) {
  return icons.spinner[frameIndex % icons.spinner.length];
}
