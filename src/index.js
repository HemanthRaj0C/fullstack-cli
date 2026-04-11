#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { createProject } from './commands/create.js';
import { fullscreen } from './ui/blessed/index.js';

const program = new Command();
const isTuiMode = process.argv.includes('--tui');

// If --tui is passed directly (without 'create' command), launch TUI immediately
// The project name is now captured as step 1 inside the TUI wizard (no pre-prompt)
if (isTuiMode && !process.argv.includes('create')) {
  await fullscreen();
  process.exit(0);
}

if (!isTuiMode) {
  // Display banner
  console.log(
    chalk.cyan(
      figlet.textSync('create-fs-cli', { font: 'Standard' })
    )
  );
  console.log(chalk.dim('\n  ▷ Rapidly scaffold full-stack applications\n'));
}

program
  .name('create-fs-cli')
  .description('CLI to scaffold full-stack applications')
  .version('1.0.0')
  .option('--tui', 'Launch fullscreen TUI wizard');

program
  .command('create')
  .description('Create a new full-stack project')
  .argument('[project-name]', 'Name of the project')
  .option('--tui', 'Launch fullscreen TUI wizard')
  .action(async (projectName, commandOptions) => {
    if (commandOptions.tui) {
      // Launch TUI — project name step is inside the TUI now
      // (if projectName was given via CLI, it's pre-filled as initial value)
      await fullscreen({ initialProjectName: projectName });
      return;
    }

    await createProject(projectName);
  });

// Handle top-level --tui option (when user runs `create-fs-cli --tui`)
program.action(async (options) => {
  if (options.tui) {
    await fullscreen();
    return;
  }
  // Default to create command if no command specified
  await createProject();
});

program.parse();
