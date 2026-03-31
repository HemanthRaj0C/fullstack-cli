import { execa } from 'execa';

async function commandExists(command, args = ['--version']) {
  try {
    await execa(command, args, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function resolveFirstAvailable(candidates) {
  for (const candidate of candidates) {
    if (await commandExists(candidate.command, candidate.args)) {
      return candidate.command;
    }
  }

  return null;
}

export async function runPreflightChecks(answers) {
  const required = [
    { label: 'git', command: 'git', args: ['--version'] },
    { label: 'npm', command: 'npm', args: ['--version'] }
  ];

  if (answers.frontend === 'nextjs' || answers.frontend === 'svelte' || answers.frontend === 'react-vite') {
    required.push({ label: 'npx', command: 'npx', args: ['--version'] });
  }

  if (answers.backend === 'fastapi') {
    const pythonCommand = await resolveFirstAvailable([
      { command: 'python3', args: ['--version'] },
      { command: 'python', args: ['--version'] }
    ]);

    if (!pythonCommand) {
      throw new Error('FastAPI backend requires Python (python3 or python) installed and available in PATH.');
    }

    const pipCommand = await resolveFirstAvailable([
      { command: 'pip3', args: ['--version'] },
      { command: 'pip', args: ['--version'] }
    ]);

    if (!pipCommand) {
      throw new Error('FastAPI backend requires pip (pip3 or pip) installed and available in PATH.');
    }
  }

  const missing = [];

  for (const tool of required) {
    if (!(await commandExists(tool.command, tool.args))) {
      missing.push(tool.label);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required tools: ${missing.join(', ')}.`);
  }
}
