#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { createProject } from './commands/create.js';

const program = new Command();

// Display banner
console.log(
  chalk.cyan(
    figlet.textSync('create-fs-cli', { font: 'Standard' })
  )
);
console.log(chalk.dim('\n  ▷ Rapidly scaffold full-stack applications\n'));

program
  .name('create-fs-cli')
  .description('CLI to scaffold full-stack applications')
  .version('1.0.0');

program
  .command('create')
  .description('Create a new full-stack project')
  .argument('[project-name]', 'Name of the project')
  .action(createProject);

// Default to create command if no command specified
if (process.argv.length === 2) {
  createProject();
} else {
  program.parse();
}
