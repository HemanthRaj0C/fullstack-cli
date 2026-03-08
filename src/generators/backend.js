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
  
  const spinner = ora('Setting up backend...').start();

  try {
    const templateUrl = TEMPLATES[backend];
    const branch = DATABASE_BRANCHES[database];
    const backendPath = path.join(projectPath, 'backend');
    const isPython = backend === 'fastapi';

    // Clone the template
    spinner.text = `Cloning ${backend} template (${branch} branch)...`;
    
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
    spinner.text = 'Installing backend dependencies...';
    
    if (isPython) {
      // For Python, just show message (user needs venv)
      spinner.succeed(`Backend (${backend}) ready!`);
      console.log(chalk.yellow('  ⚠️  Run: cd backend && pip install -r requirements.txt\n'));
    } else {
      // For Node.js backends, auto-install
      await execa('npm', ['install'], { cwd: backendPath });
      spinner.succeed(`Backend (${backend}) ready! Dependencies installed.`);
    }
    
    console.log(chalk.gray(`  Template: ${templateUrl}`));
    console.log(chalk.gray(`  Branch: ${branch}\n`));

  } catch (error) {
    spinner.fail('Backend setup failed');
    throw new Error(`Failed to setup backend: ${error.message}`);
  }
}
