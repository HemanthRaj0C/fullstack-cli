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
      args: ['--yes', 'sv@latest', 'create', 'frontend', '--template', 'minimal', '--types', 'js', '--no-install', '--no-interactive']
    },
    {
      command: 'npx',
      args: ['--yes', 'sv@latest', 'create', 'frontend', '--template', 'minimal', '--types', 'js', '--no-install']
    }
  ]
};

export async function generateFrontend(answers, projectPath) {
  const { frontend } = answers;
  const backendHealthUrl = answers.backend === 'nextjs-api' ? '/api/health' : 'http://localhost:5000/api/health';

  console.log(`\n${chalk.cyan('◯')} ${chalk.bold('Frontend')} ${chalk.dim('· Setting up')} ${chalk.white(frontend)}`);

  switch (frontend) {
    case 'nextjs':
      await generateNextJS(answers, projectPath, backendHealthUrl);
      break;
    case 'react-vite':
      await generateReactVite(answers, projectPath, backendHealthUrl);
      break;
    case 'svelte':
      await generateSvelte(answers, projectPath, backendHealthUrl);
      break;
    default:
      throw new Error(`Unsupported frontend: ${frontend}`);
  }
}

async function generateNextJS(answers, projectPath, backendHealthUrl) {
  console.log(chalk.gray('  › Running create-next-app in non-interactive mode...\n'));
  
  try {
    await runFrameworkScaffold(
      'Next.js',
      FRONTEND_SCAFFOLD_ATTEMPTS.nextjs,
      projectPath
    );

    console.log(`\n  ${chalk.green('✔')} ${chalk.dim('Next.js project created')}\n`);

    // Detect if TypeScript was chosen
    const frontendPath = path.join(projectPath, 'frontend');
    const packageJson = await fs.readJSON(path.join(frontendPath, 'package.json'));
    const isTypeScript = !!packageJson.devDependencies?.typescript;
    await ensureFrontendDependencies(frontendPath);

    // Inject BackendStatus component
    await injectBackendStatus(frontendPath, 'nextjs', isTypeScript, answers.backend === 'nextjs-api', backendHealthUrl);

  } catch (error) {
    throw new Error(`Next.js setup failed: ${error.message}`);
  }
}

async function generateReactVite(answers, projectPath, backendHealthUrl) {
  console.log(chalk.gray('  › Running create-vite in non-interactive mode...\n'));
  
  try {
    await runFrameworkScaffold(
      'Vite',
      FRONTEND_SCAFFOLD_ATTEMPTS['react-vite'],
      projectPath
    );

    console.log(`\n  ${chalk.green('✔')} ${chalk.dim('React + Vite project created')}\n`);

    // Detect if TypeScript was chosen
    const frontendPath = path.join(projectPath, 'frontend');
    const isTypeScript = await detectViteTypeScript(frontendPath);
    await ensureFrontendDependencies(frontendPath);

    // Inject BackendStatus component
    await injectBackendStatus(frontendPath, 'react-vite', isTypeScript, false, backendHealthUrl);

  } catch (error) {
    throw new Error(`Vite setup failed: ${error.message}`);
  }
}

async function generateSvelte(answers, projectPath, backendHealthUrl) {
  console.log(chalk.gray('  › Running Svelte scaffold with compatibility fallbacks...\n'));
  
  try {
    await runFrameworkScaffold(
      'SvelteKit',
      FRONTEND_SCAFFOLD_ATTEMPTS.svelte,
      projectPath
    );

    console.log(`\n  ${chalk.green('✔')} ${chalk.dim('SvelteKit project created')}\n`);

    // Detect if TypeScript was chosen
    const frontendPath = path.join(projectPath, 'frontend');
    const files = await fs.readdir(frontendPath);
    const isTypeScript = files.includes('tsconfig.json');
    await ensureFrontendDependencies(frontendPath);

    // Inject BackendStatus component
    await injectBackendStatus(frontendPath, 'svelte', isTypeScript, false, backendHealthUrl);

  } catch (error) {
    throw new Error(`SvelteKit setup failed: ${error.message}`);
  }
}

async function runScaffoldCommand(label, command, args, cwd) {
  let combinedOutput = '';
  let detectedUnexpectedDevServer = false;

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
      process.stdout.write(text);

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

async function runFrameworkScaffold(label, attempts, projectPath) {
  const errors = [];

  for (const attempt of attempts) {
    try {
      await runScaffoldCommand(label, attempt.command, attempt.args, projectPath);
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

async function ensureFrontendDependencies(frontendPath) {
  const nodeModulesPath = path.join(frontendPath, 'node_modules');
  if (await fs.pathExists(nodeModulesPath)) {
    return;
  }

  if (isTuiMode()) {
    console.log('  > Installing frontend dependencies...');
  }

  const spinner = isTuiMode()
    ? null
    : ora({ text: 'Installing frontend dependencies...', color: 'cyan' }).start();

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

    if (subprocess.all) {
      subprocess.all.on('data', (chunk) => {
        process.stdout.write(chunk.toString());
      });
    }

    await subprocess;

    if (spinner) {
      spinner.succeed(chalk.dim('Frontend dependencies installed'));
    } else {
      console.log('  > Frontend dependencies installed');
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

function isTuiMode() {
  return process.env.CREATE_FS_TUI === '1';
}
