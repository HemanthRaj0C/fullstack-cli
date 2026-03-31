const FRONTEND_CHOICES = [
  { name: 'Next.js', value: 'nextjs' },
  { name: 'React + Vite', value: 'react-vite' },
  { name: 'SvelteKit', value: 'svelte' }
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

export function getBackendChoices(frontend) {
  return BACKEND_CHOICES.filter((choice) => {
    if (choice.value !== 'nextjs-api') {
      return true;
    }
    return frontend === 'nextjs';
  });
}

export function getDatabaseChoices(backend) {
  if (backend === 'nextjs-api') {
    return [{ name: 'None', value: 'none' }];
  }

  if (backend === 'fastapi') {
    return DATABASE_CHOICES.filter((choice) => choice.value !== 'mysql');
  }

  return DATABASE_CHOICES;
}

export function normalizeStackSelection(answers) {
  const normalized = { ...answers };
  const warnings = [];

  if (normalized.backend === 'nextjs-api' && normalized.frontend !== 'nextjs') {
    throw new Error('Next.js API Routes can only be used with Next.js frontend.');
  }

  if (normalized.backend === 'nextjs-api' && normalized.database !== 'none') {
    warnings.push('Next.js API Routes is integrated mode. Database selection changed to None.');
    normalized.database = 'none';
  }

  if (normalized.backend === 'fastapi' && normalized.database === 'mysql') {
    warnings.push('FastAPI template does not support MySQL. Database selection changed to PostgreSQL.');
    normalized.database = 'postgres';
  }

  return { normalized, warnings };
}
