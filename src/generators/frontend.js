import { execa } from 'execa';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import { injectBackendStatus } from './backendStatus.js';

export async function generateFrontend(answers, projectPath) {
  const { frontend } = answers;

  console.log(chalk.cyan('\n🎨 Setting up frontend...\n'));

  switch (frontend) {
    case 'nextjs':
      await generateNextJS(answers, projectPath);
      break;
    case 'react-vite':
      await generateReactVite(answers, projectPath);
      break;
    case 'svelte':
      await generateSvelte(answers, projectPath);
      break;
  }
}

async function generateNextJS(answers, projectPath) {
  console.log(chalk.yellow('📦 Running create-next-app (follow the prompts)...\n'));
  
  try {
    // Run Next.js CLI interactively
    await execa('npx', ['create-next-app@latest', 'frontend'], {
      cwd: projectPath,
      stdio: 'inherit'
    });

    console.log(chalk.green('\n✅ Next.js project created!\n'));

    // Detect if TypeScript was chosen
    const frontendPath = path.join(projectPath, 'frontend');
    const packageJson = await fs.readJSON(path.join(frontendPath, 'package.json'));
    const isTypeScript = !!packageJson.devDependencies?.typescript;

    // Inject BackendStatus component
    await injectBackendStatus(frontendPath, 'nextjs', isTypeScript, answers.backend === 'nextjs-api');

  } catch (error) {
    throw new Error(`Next.js setup failed: ${error.message}`);
  }
}

async function generateReactVite(answers, projectPath) {
  console.log(chalk.yellow('📦 Running create-vite (follow the prompts)...\n'));
  
  try {
    // Run Vite CLI interactively
    await execa('npm', ['create', 'vite@latest', 'frontend'], {
      cwd: projectPath,
      stdio: 'inherit'
    });

    console.log(chalk.green('\n✅ React + Vite project created!\n'));

    // Detect if TypeScript was chosen
    const frontendPath = path.join(projectPath, 'frontend');
    const files = await fs.readdir(frontendPath);
    const isTypeScript = files.some(f => f.endsWith('.ts') || f.endsWith('.tsx'));

    // Inject BackendStatus component
    await injectBackendStatus(frontendPath, 'react-vite', isTypeScript, false);

  } catch (error) {
    throw new Error(`Vite setup failed: ${error.message}`);
  }
}

async function generateSvelte(answers, projectPath) {
  console.log(chalk.yellow('📦 Running create-svelte (follow the prompts)...\n'));
  
  try {
    // Run SvelteKit CLI interactively
    await execa('npm', ['create', 'svelte@latest', 'frontend'], {
      cwd: projectPath,
      stdio: 'inherit'
    });

    console.log(chalk.green('\n✅ SvelteKit project created!\n'));

    // Detect if TypeScript was chosen
    const frontendPath = path.join(projectPath, 'frontend');
    const files = await fs.readdir(frontendPath);
    const isTypeScript = files.includes('tsconfig.json');

    // Inject BackendStatus component
    await injectBackendStatus(frontendPath, 'svelte', isTypeScript, false);

  } catch (error) {
    throw new Error(`SvelteKit setup failed: ${error.message}`);
  }
}
