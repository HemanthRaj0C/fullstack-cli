const FRONTEND_CHOICES = [
  { name: 'Next.js', value: 'nextjs' },
  { name: 'React + Vite', value: 'react-vite' },
  { name: 'SvelteKit', value: 'svelte' }
];

const FRONTEND_LANGUAGE_CHOICES = [
  { name: 'JavaScript', value: 'js' },
  { name: 'TypeScript', value: 'ts' }
];

const BACKEND_CHOICES = [
  { name: 'Next.js API Routes (integrated)', value: 'nextjs-api' },
  { name: 'Express', value: 'express' },
  { name: 'Fastify', value: 'fastify' },
  { name: 'FastAPI (Python)', value: 'fastapi' }
];

const DATABASE_CHOICES = [
  { name: 'PostgreSQL', value: 'postgres' },
  { name: 'MongoDB', value: 'mongodb' },
  { name: 'MySQL', value: 'mysql' },
  { name: 'Supabase', value: 'supabase' },
  { name: 'None', value: 'none' }
];

export function getFrontendChoices() {
  return FRONTEND_CHOICES;
}

export function getLanguageChoices(frontend) {
  // Keep the signature flexible in case certain frameworks gain custom constraints later.
  if (!frontend) {
    return FRONTEND_LANGUAGE_CHOICES;
  }
  return FRONTEND_LANGUAGE_CHOICES;
}

export function getBackendChoices(frontend) {
  // Show nextjs-api only when Next.js frontend is chosen
  return BACKEND_CHOICES.filter((choice) => {
    if (choice.value !== 'nextjs-api') {
      return true;
    }
    return frontend === 'nextjs';
  });
}

export function getDatabaseChoices(backend) {
  if (backend === 'nextjs-api') {
    return DATABASE_CHOICES.filter((choice) => choice.value === 'none');
  }

  // FastAPI doesn't support MySQL
  if (backend === 'fastapi') {
    return DATABASE_CHOICES.filter((choice) => choice.value !== 'mysql');
  }

  // All other backends support all databases
  return DATABASE_CHOICES;
}

export function normalizeStackSelection(answers) {
  const normalized = { ...answers };
  const warnings = [];

  if (!normalized.language) {
    normalized.language = 'js';
  }

  if (!['js', 'ts'].includes(normalized.language)) {
    warnings.push('Unsupported frontend language selected. Language changed to JavaScript.');
    normalized.language = 'js';
  }

  if (normalized.backend === 'nextjs-api' && normalized.frontend !== 'nextjs') {
    throw new Error('Next.js API Routes can only be used with Next.js frontend.');
  }

  if (normalized.backend === 'fastapi' && normalized.database === 'mysql') {
    warnings.push('FastAPI template does not support MySQL. Database selection changed to PostgreSQL.');
    normalized.database = 'postgres';
  }

  if (normalized.backend === 'nextjs-api' && normalized.database !== 'none') {
    warnings.push('Next.js API Routes is an integrated backend. Database selection changed to None.');
    normalized.database = 'none';
  }

  return { normalized, warnings };
}
