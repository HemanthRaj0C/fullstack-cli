import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import { execa } from 'execa';
import { generateFrontend } from '../generators/frontend.js';
import { generateBackend } from '../generators/backend.js';
import { showSuccessMessage } from '../utils/messages.js';

export async function createProject(projectName) {
  try {
    // Step 1: Gather all information
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: projectName || 'my-fullstack-app',
        validate: (input) => {
          if (!/^[a-zA-Z0-9_-]+$/.test(input)) {
            return 'Project name can only contain letters, numbers, dashes, and underscores (no spaces)';
          }
          return true;
        }
      },
      {
        type: 'list',
        name: 'frontend',
        message: 'Choose frontend framework:',
        choices: [
          { name: 'Next.js', value: 'nextjs' },
          { name: 'React + Vite', value: 'react-vite' },
          { name: 'Svelte', value: 'svelte' }
        ]
      },
      {
        type: 'list',
        name: 'backend',
        message: 'Choose backend framework:',
        choices: [
          { name: 'Next.js API Routes (integrated)', value: 'nextjs-api' },
          { name: 'Express', value: 'express' },
          { name: 'Fastify', value: 'fastify' },
          { name: 'FastAPI (Python)', value: 'fastapi' }
        ]
      },
      {
        type: 'list',
        name: 'database',
        message: 'Choose database:',
        choices: [
          { name: 'PostgreSQL', value: 'postgres' },
          { name: 'MongoDB', value: 'mongodb' },
          { name: 'MySQL', value: 'mysql' },
          { name: 'Supabase', value: 'supabase' },
          { name: 'None', value: 'none' }
        ]
      }
    ]);

    // Validate backend/database combination
    if (answers.backend === 'fastapi' && answers.database === 'mysql') {
      console.log(chalk.yellow('\n⚠️  FastAPI template does not support MySQL. Defaulting to PostgreSQL.\n'));
      answers.database = 'postgres';
    }

    // Create project directory
    const projectPath = path.join(process.cwd(), answers.projectName);
    
    if (await fs.pathExists(projectPath)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `Directory ${answers.projectName} already exists. Overwrite?`,
          default: false
        }
      ]);
      
      if (!overwrite) {
        console.log(chalk.red('Aborted.'));
        process.exit(1);
      }
      await fs.remove(projectPath);
    }

    await fs.ensureDir(projectPath);
    console.log(chalk.green(`\n📁 Created project directory: ${answers.projectName}\n`));

    // Step 2: Generate frontend
    await generateFrontend(answers, projectPath);

    // Step 3: Generate backend (if not using Next.js API routes)
    if (answers.backend !== 'nextjs-api') {
      await generateBackend(answers, projectPath);
    }

    // Step 4: Clean up and prepare project
    await cleanupProject(projectPath);

    // Step 5: Create root files
    await createRootFiles(answers, projectPath);

    // Step 6: Initialize fresh git repository
    await initializeGit(projectPath);

    // Step 7: Show success message
    showSuccessMessage(answers);

  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
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
  const spinner = ora('Cleaning up...').start();
  
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
    
    spinner.succeed('Project cleaned up!');
  } catch (error) {
    spinner.warn('Cleanup warning: ' + error.message);
  }
}

async function initializeGit(projectPath) {
  const spinner = ora('Initializing git repository...').start();
  
  try {
    await execa('git', ['init'], { cwd: projectPath });
    await execa('git', ['add', '.'], { cwd: projectPath });
    await execa('git', ['commit', '-m', 'Initial commit from FullStack CLI'], { cwd: projectPath });
    
    spinner.succeed('Git repository initialized!');
  } catch (error) {
    spinner.warn('Git init skipped: ' + error.message);
  }
}
