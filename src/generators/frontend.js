import { execa } from 'execa';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import { injectBackendStatus } from './backendStatus.js';

const SCAFFOLD_TIMEOUT_MS = 8 * 60 * 1000;
const UNEXPECTED_DEV_SERVER_PATTERNS = [
  /starting dev server/i,
  /\bVITE\s+v\d/i,
  /\bLocal:\s+http:\/\/localhost:\d+/i
];
const FRONTEND_SCAFFOLD_ATTEMPTS = {
  nextjs: [
    {
      command: 'npx',
      args: [
        '--yes',
        'create-next-app@latest',
        'frontend',
        '--yes',
        '--use-npm',
        '--js',
        '--eslint',
        '--app'
      ]
    }
  ],
  'react-vite': [
    {
      command: 'npx',
      args: ['--yes', 'create-vite@latest', 'frontend', '--template', 'react', '--no-interactive']
    },
    {
      command: 'npx',
      args: ['--yes', 'create-vite@latest', 'frontend', '-t', 'react', '--no-interactive']
    }
  ],
  svelte: [
    {
      command: 'npx',
      args: ['--yes', 'sv@latest', 'create', 'frontend', '--template', 'minimal', '--types', 'jsdoc', '--no-install', '--no-add-ons', '--no-dir-check', '--no-download-check']
    },
    {
      command: 'npx',
      args: ['--yes', 'sv@latest', 'create', 'frontend', '--template', 'minimal', '--types', 'jsdoc', '--no-install', '--no-add-ons']
    }
  ]
};

export async function generateFrontend(answers, projectPath) {
  const { frontend } = answers;
  const backendHealthUrl = answers.backend === 'nextjs-api' ? '/api/health' : 'http://localhost:5000/api/health';
  const logger = createScopedLogger(answers.__log, 'frontend');
  const tuiMode = isTuiMode();

  if (!tuiMode) {
    logger(`  ${chalk.dim('›')} ${chalk.dim('Setting up')} ${chalk.white(frontend)}`);
  }

  switch (frontend) {
    case 'nextjs':
      await generateNextJS(answers, projectPath, backendHealthUrl, logger);
      break;
    case 'react-vite':
      await generateReactVite(answers, projectPath, backendHealthUrl, logger);
      break;
    case 'svelte':
      await generateSvelte(answers, projectPath, backendHealthUrl, logger);
      break;
    default:
      throw new Error(`Unsupported frontend: ${frontend}`);
  }
}

async function generateNextJS(answers, projectPath, backendHealthUrl, logger) {
  const tuiMode = isTuiMode();
  if (!tuiMode) {
    logger(chalk.gray('  › Running create-next-app in non-interactive mode...\n'));
  }
  
  try {
    await runFrameworkScaffold(
      'Next.js',
      FRONTEND_SCAFFOLD_ATTEMPTS.nextjs,
      projectPath,
      logger
    );

    if (!tuiMode) {
      logger(`  ${chalk.red('✔')} ${chalk.dim('Next.js project created')}`);
    }

    // Detect if TypeScript was chosen
    const frontendPath = path.join(projectPath, 'frontend');
    const packageJson = await fs.readJSON(path.join(frontendPath, 'package.json'));
    const isTypeScript = !!packageJson.devDependencies?.typescript;
    await ensureFrontendDependencies(frontendPath, logger);

    // Inject BackendStatus component
    await injectBackendStatus(frontendPath, 'nextjs', isTypeScript, answers.backend === 'nextjs-api', backendHealthUrl);

  } catch (error) {
    throw new Error(`Next.js setup failed: ${error.message}`);
  }
}

async function generateReactVite(answers, projectPath, backendHealthUrl, logger) {
  const tuiMode = isTuiMode();
  if (!tuiMode) {
    logger(chalk.gray('  › Running create-vite in non-interactive mode...\n'));
  }
  
  try {
    await runFrameworkScaffold(
      'Vite',
      FRONTEND_SCAFFOLD_ATTEMPTS['react-vite'],
      projectPath,
      logger
    );

    if (!tuiMode) {
      logger(`  ${chalk.red('✔')} ${chalk.dim('React + Vite project created')}`);
    }

    // Detect if TypeScript was chosen
    const frontendPath = path.join(projectPath, 'frontend');
    const isTypeScript = await detectViteTypeScript(frontendPath);
    await ensureFrontendDependencies(frontendPath, logger);

    // Inject BackendStatus component
    await injectBackendStatus(frontendPath, 'react-vite', isTypeScript, false, backendHealthUrl);

  } catch (error) {
    throw new Error(`Vite setup failed: ${error.message}`);
  }
}

async function generateSvelte(answers, projectPath, backendHealthUrl, logger) {
  const tuiMode = isTuiMode();
  if (!tuiMode) {
    logger(chalk.gray('  › Running Svelte scaffold with compatibility fallbacks...\n'));
  }
  
  try {
    await runFrameworkScaffold(
      'SvelteKit',
      FRONTEND_SCAFFOLD_ATTEMPTS.svelte,
      projectPath,
      logger
    );

    if (!tuiMode) {
      logger(`  ${chalk.red('✔')} ${chalk.dim('SvelteKit project created')}`);
    }

    // Detect if TypeScript was chosen
    const frontendPath = path.join(projectPath, 'frontend');
    const files = await fs.readdir(frontendPath);
    const isTypeScript = files.includes('tsconfig.json');
    await ensureFrontendDependencies(frontendPath, logger);

    // Inject BackendStatus component
    await injectBackendStatus(frontendPath, 'svelte', isTypeScript, false, backendHealthUrl);

  } catch (error) {
    throw new Error(`SvelteKit setup failed: ${error.message}`);
  }
}

async function runScaffoldCommand(label, command, args, cwd, logger) {
  let combinedOutput = '';
  let detectedUnexpectedDevServer = false;
  const tuiMode = isTuiMode();

  const subprocess = execa(command, args, {
    cwd,
    all: true,
    timeout: SCAFFOLD_TIMEOUT_MS,
    env: {
      ...process.env,
      CI: '1',
      npm_config_yes: 'true'
    }
  });

  if (subprocess.all) {
    subprocess.all.on('data', (chunk) => {
      const text = chunk.toString();
      combinedOutput += text;
      
      // In TUI mode, only log meaningful lines
      if (tuiMode && logger) {
        const lines = text.split('\n').filter(line => {
          const trimmed = line.trim();
          if (!trimmed) return false;
          // Skip npm progress spinners and warnings
          if (trimmed.match(/^[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/)) return false;
          if (trimmed.match(/^npm warn/i)) return false;
          if (trimmed.match(/^npm notice/i)) return false;
          if (trimmed.match(/error/i)) return true;
          if (trimmed.match(/creating|success|done|installed|complete/i)) return true;
          return false;
        });
        lines.forEach(line => logger(line.trim(), 'info'));
      } else if (!tuiMode) {
        // Output completely suppressed in non-TUI mode to let the animated spinner run cleanly
      }

      if (!detectedUnexpectedDevServer && hasUnexpectedDevServerOutput(text)) {
        detectedUnexpectedDevServer = true;
        subprocess.kill('SIGTERM', { forceKillAfterTimeout: 1000 });
      }
    });
  }

  try {
    await subprocess;

    if (detectedUnexpectedDevServer || hasUnexpectedDevServerOutput(combinedOutput)) {
      throw new Error(
        `${label} scaffolding unexpectedly started a dev server. Please retry and choose non-interactive options.`
      );
    }
  } catch (error) {
    if (detectedUnexpectedDevServer || hasUnexpectedDevServerOutput(combinedOutput)) {
      throw new Error(
        `${label} scaffolding unexpectedly started a dev server. Aborted to continue full-stack generation.`
      );
    }

    if (error.timedOut) {
      throw new Error(`${label} scaffolding timed out after ${Math.floor(SCAFFOLD_TIMEOUT_MS / 60000)} minutes.`);
    }

    throw error;
  }
}

function hasUnexpectedDevServerOutput(output) {
  return UNEXPECTED_DEV_SERVER_PATTERNS.some((pattern) => pattern.test(output));
}

async function runFrameworkScaffold(label, attempts, projectPath, logger) {
  const errors = [];
  const frontendPath = path.join(projectPath, 'frontend');

  for (const attempt of attempts) {
    if (await fs.pathExists(frontendPath)) {
      await fs.remove(frontendPath);
    }

    try {
      await runScaffoldCommand(label, attempt.command, attempt.args, projectPath, logger);
      return;
    } catch (error) {
      errors.push(`${attempt.command} ${attempt.args.join(' ')} -> ${error.message}`);
    }
  }

  throw new Error(errors.join(' | '));
}

async function detectViteTypeScript(frontendPath) {
  const checks = [
    path.join(frontendPath, 'tsconfig.json'),
    path.join(frontendPath, 'src', 'main.tsx'),
    path.join(frontendPath, 'src', 'App.tsx')
  ];

  for (const filePath of checks) {
    if (await fs.pathExists(filePath)) {
      return true;
    }
  }

  return false;
}

async function ensureFrontendDependencies(frontendPath, logger) {
  const nodeModulesPath = path.join(frontendPath, 'node_modules');
  const scopedLogger = logger || createScopedLogger(null, 'frontend');
  const tuiMode = isTuiMode();

  if (await fs.pathExists(nodeModulesPath)) {
    if (tuiMode) {
      scopedLogger('Frontend dependencies already installed by scaffold', 'success');
    } else {
      scopedLogger(`  ${chalk.red('✔')} ${chalk.dim('Frontend dependencies already installed by scaffold')}`);
    }
    return;
  }

  if (tuiMode) {
    scopedLogger('Installing frontend dependencies...', 'info');
  }

  const spinner = tuiMode
    ? null
    : ora({ text: 'Installing frontend dependencies...', color: 'red', spinner: 'dots', indent: 2 }).start();

  try {
    const subprocess = execa('npm', ['install'], {
      cwd: frontendPath,
      all: true,
      timeout: SCAFFOLD_TIMEOUT_MS,
      env: {
        ...process.env,
        CI: '1',
        npm_config_yes: 'true'
      }
    });

    // We remove the stdout streaming so the spinner remains neat and compact
    // without dumping verbose install logs on the screen.

    await subprocess;

    if (spinner) {
      spinner.succeed(chalk.dim('Frontend dependencies installed'));
    } else if (tuiMode) {
      scopedLogger('Frontend dependencies installed', 'success');
    }
  } catch (error) {
    if (spinner) {
      spinner.fail(chalk.red('Frontend dependency installation failed'));
    }

    if (error.timedOut) {
      throw new Error('Frontend dependency installation timed out.');
    }
    throw new Error(`Failed to install frontend dependencies: ${error.message}`);
  }
}

function createScopedLogger(externalLogger, phase) {
  if (typeof externalLogger === 'function') {
    return (message, type = 'info') => externalLogger(message, type, phase);
  }

  return (message) => console.log(message);
}

function isTuiMode() {
  return process.env.CREATE_FS_TUI === '1';
}
