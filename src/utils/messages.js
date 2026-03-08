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

  let message = chalk.green.bold('✅ Project created successfully!') + '\n\n';
  
  message += chalk.white('📦 Stack:\n');
  message += chalk.gray(`   Frontend: ${frontendName}\n`);
  message += chalk.gray(`   Backend:  ${backendName}\n`);
  message += chalk.gray(`   Database: ${dbName}\n\n`);

  if (hasBackend && database !== 'none') {
    message += chalk.yellow('⚙️  Configure database:\n');
    message += chalk.white(`   Edit ${chalk.cyan('backend/.env')} with your credentials\n\n`);
  }

  message += chalk.yellow('📦 Install dependencies:\n');
  message += chalk.white(`   cd ${projectName}\n`);
  message += chalk.white(`   cd frontend && npm install\n`);
  
  if (hasBackend) {
    if (isPython) {
      message += chalk.white(`   cd ../backend && pip install -r requirements.txt\n\n`);
    } else {
      message += chalk.white(`   cd ../backend && npm install\n\n`);
    }
  } else {
    message += '\n';
  }

  message += chalk.yellow('🚀 Start development:\n');
  
  if (hasBackend) {
    message += chalk.gray('   # Terminal 1 - Backend:\n');
    message += chalk.white(`   cd backend && ${isPython ? 'uvicorn main:app --reload --port 5000' : 'npm run dev'}\n\n`);
    message += chalk.gray('   # Terminal 2 - Frontend:\n');
  }
  
  message += chalk.white(`   cd frontend && npm run dev\n\n`);

  message += chalk.cyan('🌐 URLs:\n');
  message += chalk.white('   Frontend: http://localhost:3000\n');
  
  if (hasBackend) {
    message += chalk.white('   Backend:  http://localhost:5000\n');
    message += chalk.white('   Health:   http://localhost:5000/api/health\n\n');
  } else {
    message += '\n';
  }

  message += chalk.magenta('👁️  Backend Status Indicator:\n');
  message += chalk.gray('   Look for the status badge in the top-right corner!');

  console.log(
    boxen(message, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan'
    })
  );
}
