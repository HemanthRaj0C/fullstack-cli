import boxen from 'boxen';
import chalk from 'chalk';
import gradient from 'gradient-string';

const btopGradient = gradient(['#ff3333', '#cc0000']);

export function showSuccessMessage(answers) {
  const { projectName, frontend, language = 'js', backend, database } = answers;
  
  const frontendBaseName = frontend === 'nextjs' ? 'Next.js' : 
                           frontend === 'react-vite' ? 'React + Vite' : 'SvelteKit';
  const languageName = language === 'ts' ? 'TypeScript' : 'JavaScript';
  const frontendName = `${frontendBaseName} (${languageName})`;
  
  const backendName = backend === 'nextjs-api' ? 'Next.js API Routes' :
                      backend === 'express' ? 'Express' :
                      backend === 'fastify' ? 'Fastify' : 'FastAPI';
  
  const dbName = database === 'none' ? 'None' : 
                 database.charAt(0).toUpperCase() + database.slice(1);

  const hasBackend = backend !== 'nextjs-api';
  const isPython = backend === 'fastapi';

  const log = [];

  // Gradient title
  log.push(btopGradient('  ✦ PROJECT CREATED SUCCESSFULLY ✦') + '\n');
  log.push(`${chalk.dim('  Project')}  ${chalk.white.bold(projectName)}\n`);

  // Tech Stack
  log.push(chalk.red.bold('  Tech Stack'));
  log.push(`  ${chalk.dim('├─')} Frontend   ${chalk.red(frontendName.padEnd(18))}`);
  log.push(`  ${chalk.dim('├─')} Backend    ${chalk.red(backendName.padEnd(18))}`);
  log.push(`  ${chalk.dim('└─')} Database   ${chalk.red(dbName.padEnd(18))}\n`);

  // Next Steps
  log.push(chalk.white.bold('  Next Steps'));
  
  let stepNum = 1;
  log.push(`  ${chalk.dim(stepNum++ + '.')} ${chalk.white('cd')} ${chalk.red(projectName)}`);

  log.push(`  ${chalk.dim(stepNum++ + '.')} Install dependencies:`);
  log.push(`     ${chalk.red('cd')} frontend ${chalk.dim('&&')} ${chalk.red('npm install')}`);
  if (hasBackend) {
    log.push(`     ${chalk.red('cd')} backend ${chalk.dim('&&')} ${chalk.red(isPython ? 'pip install -r requirements.txt' : 'npm install')}`);
  } else {
    log.push(chalk.dim('     (Next.js scaffold usually preinstalls frontend deps)'));
  }
  log.push('');

  if (hasBackend && database !== 'none') {
    log.push(`  ${chalk.dim(stepNum++ + '.')} Configure database in ${chalk.red.bold('backend/.env')}`);
  }

  log.push(`  ${chalk.dim(stepNum++ + '.')} Start development servers:\n`);
  
  if (hasBackend) {
    log.push(chalk.dim('     # Terminal 1 — Backend'));
    log.push(`     ${chalk.red('cd')} backend`);
    log.push(`     ${chalk.red(isPython ? 'uvicorn main:app --reload --port 5000' : 'npm run dev')}\n`);
    
    log.push(chalk.dim('     # Terminal 2 — Frontend'));
    log.push(`     ${chalk.red('cd')} frontend`);
    log.push(`     ${chalk.red('npm run dev')}\n`);
  } else {
    log.push(`     ${chalk.red('cd')} frontend`);
    log.push(`     ${chalk.red('npm run dev')}\n`);
  }

  // Footer info
  log.push(chalk.dim('  ' + '─'.repeat(45)));
  log.push(`  ${chalk.dim('Local:')}    ${chalk.red('http://localhost:3000')}`);
  
  if (hasBackend) {
    log.push(`  ${chalk.dim('API:')}      ${chalk.red('http://localhost:5000')}`);
  }
  
  log.push(`  ${chalk.dim('Docs:')}     Check the README.md for full setup guide`);
  log.push('');
  log.push(`  ${chalk.red('★')} ${chalk.dim('Star us:')} ${chalk.red('github.com/HemanthRaj0C/fullstack-cli')}`);

  console.log(
    boxen(log.join('\n'), {
      padding: { top: 1, bottom: 1, left: 1, right: 6 },
      margin: { top: 1, bottom: 1, left: 0, right: 0 },
      borderStyle: 'round',
      borderColor: 'red',
    })
  );
}
