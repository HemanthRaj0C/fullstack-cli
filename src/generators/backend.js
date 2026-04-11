import { execa } from 'execa';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';

// GitHub template repositories
const TEMPLATES = {
  express: 'https://github.com/HemanthRaj0C/express-template',
  fastify: 'https://github.com/HemanthRaj0C/fastify-template',
  fastapi: 'https://github.com/HemanthRaj0C/fastapi-template'
};

// Database to branch mapping
const DATABASE_BRANCHES = {
  postgres: 'postgres',
  mongodb: 'mongodb',
  mysql: 'mysql',
  supabase: 'postgres', // Supabase uses PostgreSQL
  none: 'main'
};

export async function generateBackend(answers, projectPath) {
  const { backend, database } = answers;
  const logger = createScopedLogger(answers.__log, 'backend');
  const tuiMode = isTuiMode();
  
  // Only show styled header in non-TUI mode
  if (!tuiMode) {
    logger(`  ${chalk.dim('›')} ${chalk.dim('Setting up')} ${chalk.white(backend)}`);
  }
  
  const spinner = tuiMode ? null : ora({ text: 'Initializing...', color: 'red', spinner: 'dots', indent: 2 }).start();

  try {
    const templateUrl = TEMPLATES[backend];
    const branch = DATABASE_BRANCHES[database];
    const backendPath = path.join(projectPath, 'backend');
    const isPython = backend === 'fastapi';
    
    // Update spinner text
    if (spinner) {
      spinner.text = `Cloning ${backend} template (${branch} branch)...`;
    } else {
      logger(`  > Cloning ${backend} template (${branch} branch)...`);
    }
    
    await execa('git', [
      'clone',
      '-b', branch,
      '--single-branch',
      '--depth', '1',
      templateUrl,
      'backend'
    ], { cwd: projectPath });

    // Remove .git directory to make it user's own project
    await fs.remove(path.join(backendPath, '.git'));

    // Copy .env.example to .env
    const envExample = path.join(backendPath, '.env.example');
    const envFile = path.join(backendPath, '.env');
    
    if (await fs.pathExists(envExample)) {
      await fs.copy(envExample, envFile);
    }

    // If using Supabase, add a comment to .env
    if (database === 'supabase' && await fs.pathExists(envFile)) {
      let envContent = await fs.readFile(envFile, 'utf-8');
      envContent = `# Using Supabase - Update DATABASE_URL with your Supabase connection string\n` + envContent;
      await fs.writeFile(envFile, envContent);
    }

    // Install dependencies
    if (spinner) {
      spinner.text = 'Installing backend dependencies...';
    } else {
      logger('  > Installing backend dependencies...');
    }
    
    if (isPython) {
      // For Python, just show message (user needs venv)
      if (spinner) {
        spinner.succeed(chalk.dim('Backend ready'));
      } else {
        logger('Backend ready', 'success');
      }
      if (!tuiMode) {
        logger(`  ${chalk.red('⚠')} ${chalk.dim('Run: cd backend && pip install -r requirements.txt')}\n`);
      } else {
        logger('Run: cd backend && pip install -r requirements.txt', 'warning');
      }
    } else {
      // For Node.js backends, auto-install
      const subprocess = execa('npm', ['install'], {
        cwd: backendPath,
        all: true
      });

      // We don't stream npm output natively to keep the UI spinner clean and compact.

      await subprocess;

      if (spinner) {
        spinner.succeed(chalk.dim('Backend ready (dependencies installed)'));
      } else {
        logger('Backend dependencies installed', 'success');
      }
    }

  } catch (error) {
    if (spinner) {
      spinner.fail(chalk.red('Backend setup failed'));
    }
    throw new Error(`Failed to setup backend: ${error.message}`);
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
