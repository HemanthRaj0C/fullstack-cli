#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import { createProject } from './commands/create.js';
import { fullscreen } from './ui/blessed/index.js';
import { installNonTuiTerminalGuards, restoreTerminalState } from './utils/terminal.js';

const program = new Command();
const isTuiMode = process.argv.includes('--tui');

program
  .name('create-fs-cli')
  .description('Scaffold full-stack applications in classic prompts or fullscreen TUI mode')
  .version('1.1.1')
  .showHelpAfterError()
  .allowExcessArguments(false)
  .argument('[project-name]', 'Project name (same validation as interactive mode)')
  .option('--tui', 'Launch the fullscreen TUI wizard')
  .addHelpText(
    'after',
    `
Quick Start:
  npx create-fs-cli@latest
  npx create-fs-cli@latest my-app
  npx create-fs-cli@latest my-app --tui

Global Install:
  npm install -g create-fs-cli
  create-fs-cli --help
  create-fs-cli my-app
  create-fs-cli my-app --tui

Local Development:
  npm install
  node src/index.js --help
  node src/index.js
  node src/index.js my-app
  node src/index.js my-app --tui

Project Name Rules:
  Allowed: letters, numbers, dashes (-), underscores (_)
  Must start with: a letter or number
  Max length: 50
  Direct CLI args are auto-sanitized when possible (for example "My App" -> "My-App")
`
  );
// Main command behavior
program.action(async (projectName, options) => {
  if (options.tui) {
    await fullscreen({ initialProjectName: projectName });
    return;
  }
  // Default behavior: scaffold project in classic mode
  await createProject(projectName);
});

async function main() {
  // btop-inspired red gradient
  const btopGradient = gradient(['#ff3333', '#cc0000']);

  if (!isTuiMode) {
    installNonTuiTerminalGuards(() => {
      console.log(`\n${chalk.dim('Interrupted. Exiting...')}`);
    });

    // Premium gradient banner
    const bannerText = figlet.textSync('fs-cli', {
      font: 'ANSI Shadow',
      horizontalLayout: 'fitted',
    });
    console.log('');
    console.log(btopGradient(bannerText));
    console.log(
      chalk.dim('  ─────────────────────────────────────────────────────────')
    );
    console.log(
      `  ${chalk.red('▸')} ${chalk.white.bold('Fullstack scaffolding')} ${chalk.dim('·')} ${chalk.gray('Scaffolding so fast, it feels illegal.')}`
    );
    console.log(
      `  ${chalk.dim('  Run with')} ${chalk.red('--tui')} ${chalk.dim('for the fullscreen experience')}`
    );
    console.log(
      chalk.dim('  ─────────────────────────────────────────────────────────\n')
    );
  }

  await program.parseAsync(process.argv);
}

void main().catch((error) => {
  restoreTerminalState();

  if (error?.name === 'ExitPromptError') {
    console.log(`\n${chalk.dim('Interrupted. Exiting...')}`);
    process.exit(130);
  }

  const message = error?.message || String(error);
  console.error(`\n${chalk.red('Unhandled error:')} ${message}\n`);
  process.exit(1);
});
