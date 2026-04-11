import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import gradient from 'gradient-string';
import boxen from 'boxen';
import path from 'path';
import fs from 'fs-extra';
import { execa } from 'execa';
import { generateFrontend } from '../generators/frontend.js';
import { generateBackend } from '../generators/backend.js';
import { showSuccessMessage } from '../utils/messages.js';
import {
  PROJECT_NAME_ALLOWED_TEXT,
  PROJECT_NAME_MAX_LENGTH,
  resolveProjectNameInput,
  validateProjectName
} from '../utils/projectName.js';
import { restoreTerminalState } from '../utils/terminal.js';
import {
  getFrontendChoices,
  getBackendChoices,
  getDatabaseChoices,
  normalizeStackSelection
} from '../utils/stack.js';
import { runPreflightChecks } from '../utils/preflight.js';

// ─── Theme constants ─────────────────────────────────────────
const ICONS = {
  step:    '◆',
  done:    '✔',
  fail:    '✖',
  warn:    '⚠',
  arrow:   '▸',
  pointer: '❯',
  dot:     '·',
};

const btopGradient = gradient(['#ff3333', '#cc0000']);

// Styled section header
function sectionHeader(title) {
  console.log(`\n  ${chalk.gray('▸')} ${chalk.white.bold(title)}`);
  console.log(chalk.dim(`  ${'─'.repeat(title.length + 2)}`));
}

// Create a sub-step spinner
function createSpinner(text) {
  return ora({
    text: chalk.dim(text),
    color: 'red',
    spinner: 'dots',
    indent: 2,
  });
}

// Step result (after spinner succeeds)
function stepResult(label, detail = '') {
  const detailStr = detail ? ` ${chalk.dim(ICONS.dot)} ${chalk.dim(detail)}` : '';
  console.log(`  ${chalk.red(ICONS.done)} ${chalk.bold(label)}${detailStr}`);
}

export async function createProject(projectName, options = {}) {
  let projectPath;
  let projectCreated = false;
  let projectExistedBefore = false;

  try {
    // ─── Step 1: Gather info ───────────────────────────────
    console.log(`\n  ${chalk.red('▸')} ${chalk.white.bold('Configure Your Stack')}`);
    console.log(chalk.dim(`  ${'─'.repeat(22)}`));

    let providedProjectName = projectName || options.answers?.projectName;
    
    // Build project name prompt
    if (!providedProjectName) {
      const namePrompt = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: chalk.white('Project name') + chalk.dim(' ·'),
          prefix: chalk.red(ICONS.pointer),
          default: 'my-fullstack-app',
          validate: (input) => {
            const result = validateProjectName(input);
            if (!result.valid) {
              const suggestion = result.suggestion ? ` Try: ${result.suggestion}` : '';
              return chalk.red(`${result.reason}${suggestion}`);
            }
            return true;
          },
          transformer: (input) => chalk.white(input),
        }
      ]);
      providedProjectName = namePrompt.projectName;
    }

    const projectNameResolution = resolveProjectNameInput(providedProjectName, {
      autoSanitize: Boolean(projectName)
    });

    if (!projectNameResolution.ok) {
      const suggestion = projectNameResolution.suggestion
        ? ` Suggested: ${chalk.white.bold(projectNameResolution.suggestion)}`
        : '';
      throw new Error(
        `${projectNameResolution.reason} Allowed: ${PROJECT_NAME_ALLOWED_TEXT}. Max length: ${PROJECT_NAME_MAX_LENGTH}.${suggestion}`
      );
    }

    if (projectNameResolution.wasSanitized) {
      console.log(
        `  ${chalk.red(ICONS.warn)} ${chalk.bold('Name sanitized')} ${chalk.dim(ICONS.dot)} ${chalk.dim(projectNameResolution.original)} ${chalk.dim('->')} ${chalk.white.bold(projectNameResolution.value)}`
      );
    }

    providedProjectName = projectNameResolution.value;
    
    // Directory check IMMEDIATELY after knowing project name
    projectPath = path.join(process.cwd(), providedProjectName);
    
    if (await fs.pathExists(projectPath)) {
      projectExistedBefore = true;

      let overwrite = false;
      if (typeof options.overwrite === 'boolean') {
        overwrite = options.overwrite;
      } else {
        const overwriteAnswer = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            prefix: chalk.red(ICONS.warn),
            message: `Directory ${chalk.bold(providedProjectName)} already exists. Overwrite?`,
            default: false
          }
        ]);
        overwrite = overwriteAnswer.overwrite;
      }
      
      if (!overwrite) {
        const abortError = new Error('Aborted by user.');
        abortError.code = 'ABORTED';
        throw abortError;
      }
      await fs.remove(projectPath);
    }
    
    // Now prompt for the stack choices
    const prompts = [
      {
        type: 'list',
        name: 'frontend',
        message: chalk.white('Frontend framework') + chalk.dim(' ·'),
        prefix: chalk.red(ICONS.pointer),
        choices: getFrontendChoices().map(c => ({
          ...c,
          name: `${chalk.white(c.name)}`,
        })),
      },
      {
        type: 'list',
        name: 'backend',
        message: chalk.white('Backend framework') + chalk.dim(' ·'),
        prefix: chalk.red(ICONS.pointer),
        choices: (currentAnswers) => getBackendChoices(currentAnswers.frontend).map(c => ({
          ...c,
          name: `${chalk.white(c.name)}`,
        })),
      },
      {
        type: 'list',
        name: 'database',
        message: chalk.white('Database') + chalk.dim(' ·'),
        prefix: chalk.red(ICONS.pointer),
        choices: (currentAnswers) => getDatabaseChoices(currentAnswers.backend).map(c => ({
          ...c,
          name: `${chalk.white(c.name)}`,
        })),
      }
    ];

    const stackAnswers = options.answers ? { ...options.answers } : await inquirer.prompt(prompts);
    const answers = { ...stackAnswers, projectName: providedProjectName };

    if (!options.answers) {
      console.log(); // Add spacing after prompts
    }

    const { normalized, warnings } = normalizeStackSelection(answers);
    Object.assign(answers, normalized);

    for (const warning of warnings) {
      console.log(`  ${chalk.red(ICONS.warn)} ${chalk.bold('Warning')} ${chalk.dim(ICONS.dot + ' ' + warning)}`);
    }

    // ─── Stack summary ─────────────────────────────────────
    const displayNames = {
      'nextjs': 'Next.js', 'react-vite': 'React + Vite', 'svelte': 'SvelteKit',
      'nextjs-api': 'Next.js API', 'express': 'Express', 'fastify': 'Fastify', 'fastapi': 'FastAPI',
      'postgres': 'PostgreSQL', 'mongodb': 'MongoDB', 'mysql': 'MySQL', 'supabase': 'Supabase', 'none': 'None',
    };
    const dn = (v) => displayNames[v] || v;

    const summaryLines = [
      `${chalk.white.bold(answers.projectName)}`,
      '',
      `${chalk.dim('├─')} Frontend   ${chalk.red(dn(answers.frontend))}`,
      `${chalk.dim('├─')} Backend    ${chalk.red(dn(answers.backend))}`,
      `${chalk.dim('└─')} Database   ${chalk.red(dn(answers.database))}`,
    ];

    console.log(
      boxen(summaryLines.join('\n'), {
        padding: { top: 0, bottom: 0, left: 2, right: 3 },
        margin: { top: 0, bottom: 0, left: 1, right: 0 },
        borderStyle: 'round',
        borderColor: 'gray',
        title: chalk.dim(' Stack Summary '),
        titleAlignment: 'left',
      })
    );

    // ─── Step 2: Preflight ─────────────────────────────────
    sectionHeader('Preflight Checks');
    await runPreflightChecks(answers);
    stepResult('Preflight', 'required tools detected');

    // Create project directory
    // Note: Directory overwrite check is now handled right after projectName prompt at the start.
    await fs.ensureDir(projectPath);
    projectCreated = true;
    stepResult('Project Directory', answers.projectName);

    // ─── Step 3: Frontend ──────────────────────────────────
    sectionHeader(`Frontend Setup ${chalk.dim('· ' + dn(answers.frontend))}`);
    await generateFrontend(answers, projectPath);
    stepResult('Frontend Setup', `${dn(answers.frontend)} ready`);

    // ─── Step 4: Backend ───────────────────────────────────
    if (answers.backend !== 'nextjs-api') {
      sectionHeader(`Backend Setup ${chalk.dim('· ' + dn(answers.backend))}`);
      await generateBackend(answers, projectPath);
      stepResult('Backend Setup', `${dn(answers.backend)} ready`);
    } else {
      stepResult('Backend Setup', 'integrated with Next.js');
    }

    // ─── Step 5: Cleanup ───────────────────────────────────
    await cleanupProject(projectPath);

    // ─── Step 6: Root files ────────────────────────────────
    await createRootFiles(answers, projectPath);

    // ─── Step 7: Git ───────────────────────────────────────
    await initializeGit(projectPath);

    // ─── Step 8: Success ───────────────────────────────────
    console.log(); // Empty line before success message
    showSuccessMessage(answers);

  } catch (error) {
    if (projectCreated && projectPath && !projectExistedBefore) {
      await cleanupFailedProject(projectPath);
    }

    // Inquirer throws ExitPromptError on Ctrl+C; map it to interrupt semantics.
    if (error?.name === 'ExitPromptError') {
      restoreTerminalState();

      if (options.noExit) {
        throw error;
      }

      console.log(`\n  ${chalk.dim('Interrupted. Exiting...')}\n`);
      process.exit(130);
    }

    console.error(`\n  ${chalk.red(ICONS.fail)} ${chalk.bold('Error')} ${chalk.dim(ICONS.dot)} ${error.message}\n`);

    if (options.noExit) {
      throw error;
    }

    restoreTerminalState();

    process.exit(1);
  }
}

async function cleanupFailedProject(projectPath) {
  try {
    await fs.remove(projectPath);
    console.log(`  ${chalk.red(ICONS.warn)} ${chalk.dim('Removed partially generated project directory after failure.')}`);
  } catch (error) {
    console.log(`  ${chalk.red(ICONS.warn)} ${chalk.dim(`Could not clean partial project: ${error.message}`)}`);
  }
}

async function createRootFiles(answers, projectPath) {
  // Create root .gitignore
  const gitignore = `# Dependencies
node_modules/
venv/
.venv/

# Environment
.env
.env.local
.env.*.local

# Build
.next/
dist/
build/
__pycache__/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
`;

  await fs.writeFile(path.join(projectPath, '.gitignore'), gitignore);

  // Create root README
  const readme = `# ${answers.projectName}

Full-stack application generated with FullStack CLI.

## Stack
- **Frontend**: ${answers.frontend === 'nextjs' ? 'Next.js' : answers.frontend === 'react-vite' ? 'React + Vite' : 'Svelte'}
- **Backend**: ${answers.backend === 'nextjs-api' ? 'Next.js API Routes' : answers.backend === 'express' ? 'Express' : answers.backend === 'fastify' ? 'Fastify' : 'FastAPI'}
- **Database**: ${answers.database === 'none' ? 'None' : answers.database.charAt(0).toUpperCase() + answers.database.slice(1)}

## Getting Started

### Install Dependencies

\`\`\`bash
# Frontend
cd frontend
npm install

${answers.backend !== 'nextjs-api' ? `# Backend
cd ../backend
${answers.backend === 'fastapi' ? 'pip install -r requirements.txt' : 'npm install'}` : ''}
\`\`\`

### Configure Environment

${answers.backend !== 'nextjs-api' ? `1. Edit \`backend/.env\` with your database credentials` : ''}

### Start Development

\`\`\`bash
${answers.backend !== 'nextjs-api' ? `# Terminal 1 - Backend
cd backend
${answers.backend === 'fastapi' ? 'uvicorn main:app --reload --port 5000' : 'npm run dev'}

# Terminal 2 - Frontend` : '# Frontend'}
cd frontend
npm run dev
\`\`\`

### URLs
- Frontend: http://localhost:3000
${answers.backend !== 'nextjs-api' ? '- Backend: http://localhost:5000' : ''}
${answers.backend !== 'nextjs-api' ? '- Health Check: http://localhost:5000/api/health' : ''}

## Backend Status Indicator

The frontend includes a visual indicator in the top-right corner showing backend connection status:
- 🔄 **Checking** - Connecting to backend
- ✅ **Connected** - Backend is running
- ❌ **Disconnected** - Backend is not reachable
`;

  await fs.writeFile(path.join(projectPath, 'README.md'), readme);
}

async function cleanupProject(projectPath) {
  const spinner = createSpinner('Cleaning up...');
  spinner.start();
  
  try {
    // Remove .git from frontend (created by create-next-app, create-vite, etc.)
    const frontendGit = path.join(projectPath, 'frontend', '.git');
    if (await fs.pathExists(frontendGit)) {
      await fs.remove(frontendGit);
    }
    
    // Remove .git from backend (already done in backend.js, but just in case)
    const backendGit = path.join(projectPath, 'backend', '.git');
    if (await fs.pathExists(backendGit)) {
      await fs.remove(backendGit);
    }
    
    spinner.succeed(chalk.dim('Project cleaned up'));
  } catch (error) {
    spinner.warn(chalk.red('Cleanup warning: ' + error.message));
  }
}

async function initializeGit(projectPath) {
  const spinner = createSpinner('Initializing git repository...');
  spinner.start();
  
  try {
    await execa('git', ['init'], { cwd: projectPath });
    await execa('git', ['add', '.'], { cwd: projectPath });
    await execa('git', ['commit', '-m', 'Initial commit from FullStack CLI'], { cwd: projectPath });
    
    spinner.succeed(chalk.dim('Git repository initialized'));
  } catch (error) {
    spinner.warn(chalk.red('Git init skipped: ' + error.message));
  }
}
