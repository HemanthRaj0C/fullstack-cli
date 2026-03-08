import boxen from 'boxen';
import chalk from 'chalk';

export function showSuccessMessage(answers) {
  const { projectName, frontend, backend, database } = answers;
  
  const frontendName = frontend === 'nextjs' ? 'Next.js' : 
                       frontend === 'react-vite' ? 'React + Vite' : 'SvelteKit';
  
  const backendName = backend === 'nextjs-api' ? 'Next.js API Routes' :
                      backend === 'express' ? 'Express' :
                      backend === 'fastify' ? 'Fastify' : 'FastAPI';
  
  const dbName = database === 'none' ? 'None' : 
                 database.charAt(0).toUpperCase() + database.slice(1);

  const hasBackend = backend !== 'nextjs-api';
  const isPython = backend === 'fastapi';

  const log = [];

  // Title
  log.push(`${chalk.bgGreen.black.bold(' SUCCESS ')} ${chalk.green(`Created ${chalk.bold(projectName)}`)}\n`);

  // Tech Stack (Tree style)
  log.push(chalk.cyan.bold('Tech Stack'));
  log.push(`${chalk.gray('├─')} Frontend   ${chalk.white(frontendName)}`);
  log.push(`${chalk.gray('├─')} Backend    ${chalk.white(backendName)}`);
  log.push(`${chalk.gray('└─')} Database   ${chalk.white(dbName)}\n`);

  // Next Steps
  log.push(chalk.cyan.bold('Next Steps'));
  
  let stepNum = 1;
  log.push(`${chalk.gray(`${stepNum++}.`)} cd ${projectName}`);

  if (hasBackend && database !== 'none') {
    log.push(`${chalk.gray(`${stepNum++}.`)} Configure database inside ${chalk.white.bold('backend/.env')}`);
  }

  log.push(`${chalk.gray(`${stepNum++}.`)} Start development servers:\n`);
  
  if (hasBackend) {
    log.push(chalk.gray('   # Terminal 1 (Backend)'));
    log.push(`   ${chalk.cyan('cd')} backend`);
    log.push(`   ${chalk.cyan(isPython ? 'uvicorn main:app --reload --port 5000' : 'npm run dev')}\n`);
    
    log.push(chalk.gray('   # Terminal 2 (Frontend)'));
    log.push(`   ${chalk.cyan('cd')} frontend`);
    log.push(`   ${chalk.cyan('npm run dev')}\n`);
  } else {
    log.push(`   ${chalk.cyan('cd')} frontend`);
    log.push(`   ${chalk.cyan('npm run dev')}\n`);
  }

  // Footer info
  log.push(chalk.gray('─'.repeat(45)));
  log.push(`${chalk.gray('Local:')}    ${chalk.white('http://localhost:3000')}`);
  
  if (hasBackend) {
    log.push(`${chalk.gray('API:')}      ${chalk.white('http://localhost:5000')}`);
  }
  
  log.push(`${chalk.gray('Note:')}     Check the UI status badge for connection status.`);

  console.log(
    boxen(log.join('\n'), {
      padding: { top: 1, bottom: 1, left: 2, right: 3 },
      margin: { top: 1, bottom: 1, left: 0, right: 0 },
      borderStyle: 'round',
      borderColor: 'gray'
    })
  );
}
