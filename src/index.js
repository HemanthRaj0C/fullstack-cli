#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { createProject } from './commands/create.js';

const program = new Command();

// Display banner
console.log(
  chalk.cyan(
    figlet.textSync('FSCLI', { font: 'ANSI Shadow' })
  )
);
console.log(chalk.gray('  Full-Stack CLI - Scaffold applications with ease\n'));

program
  .name('full-fscli')
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
