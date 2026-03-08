import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import ora from 'ora';

export async function injectBackendStatus(frontendPath, framework, isTypeScript, isIntegrated) {
  const spinner = ora('Adding BackendStatus component...').start();

  try {
    switch (framework) {
      case 'nextjs':
        await injectNextJS(frontendPath, isTypeScript, isIntegrated);
        break;
      case 'react-vite':
        await injectReactVite(frontendPath, isTypeScript);
        break;
      case 'svelte':
        await injectSvelte(frontendPath, isTypeScript);
        break;
    }
    spinner.succeed('BackendStatus component added!');
  } catch (error) {
    spinner.warn(`Could not auto-inject BackendStatus: ${error.message}`);
    console.log(chalk.yellow('  You can manually add the BackendStatus component later.\n'));
  }
}

// ============== NEXT.JS ==============
async function injectNextJS(frontendPath, isTypeScript, isIntegrated) {
  const ext = isTypeScript ? 'tsx' : 'jsx';
  
  // Determine if using App Router or Pages Router
  const appDir = path.join(frontendPath, 'app');
  const srcAppDir = path.join(frontendPath, 'src', 'app');
  
  let targetDir;
  if (await fs.pathExists(appDir)) {
    targetDir = appDir;
  } else if (await fs.pathExists(srcAppDir)) {
    targetDir = srcAppDir;
  } else {
    throw new Error('Could not find app directory');
  }

  // Create components directory
  const componentsDir = path.join(targetDir, 'components');
  await fs.ensureDir(componentsDir);

  // Backend URL - use relative path for integrated, absolute for separate
  const backendUrl = isIntegrated ? '/api/health' : 'http://localhost:5000/api/health';

  // Create BackendStatus component
  const componentCode = getNextJSBackendStatusCode(isTypeScript, backendUrl);
  await fs.writeFile(
    path.join(componentsDir, `BackendStatus.${ext}`),
    componentCode
  );

  // Try to modify page file
  const pageFile = await findFile(targetDir, `page.${ext}`);
  if (pageFile) {
    await modifyNextJSPage(pageFile, isTypeScript);
  }
}

function getNextJSBackendStatusCode(isTypeScript, backendUrl) {
  if (isTypeScript) {
    return `'use client'
import { useEffect, useState } from 'react'

type Status = 'checking' | 'connected' | 'disconnected'

export default function BackendStatus() {
  const [status, setStatus] = useState<Status>('checking')
  
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch('${backendUrl}')
        setStatus(res.ok ? 'connected' : 'disconnected')
      } catch {
        setStatus('disconnected')
      }
    }
    
    checkBackend()
    const interval = setInterval(checkBackend, 5000)
    return () => clearInterval(interval)
  }, [])
  
  const statusConfig = {
    checking: { dot: '#fbbf24', text: 'Checking...' },
    connected: { dot: '#22c55e', text: 'Connected' },
    disconnected: { dot: '#ef4444', text: 'Disconnected' }
  }
  
  const { dot, text } = statusConfig[status]
  
  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: 'rgba(255, 255, 255, 0.9)',
      padding: '0.5rem 0.875rem',
      borderRadius: '9999px',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      zIndex: 50,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '0.8125rem',
      fontWeight: 500,
      letterSpacing: '-0.01em',
      transition: 'all 0.2s ease'
    }}>
      <span style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: dot,
        boxShadow: \`0 0 8px \${dot}\`
      }} />
      <span>Backend: {text}</span>
    </div>
  )
}
`;
  }

  return `'use client'
import { useEffect, useState } from 'react'

export default function BackendStatus() {
  const [status, setStatus] = useState('checking')
  
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch('${backendUrl}')
        setStatus(res.ok ? 'connected' : 'disconnected')
      } catch {
        setStatus('disconnected')
      }
    }
    
    checkBackend()
    const interval = setInterval(checkBackend, 5000)
    return () => clearInterval(interval)
  }, [])
  
  const statusConfig = {
    checking: { dot: '#fbbf24', text: 'Checking...' },
    connected: { dot: '#22c55e', text: 'Connected' },
    disconnected: { dot: '#ef4444', text: 'Disconnected' }
  }
  
  const { dot, text } = statusConfig[status]
  
  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: 'rgba(255, 255, 255, 0.9)',
      padding: '0.5rem 0.875rem',
      borderRadius: '9999px',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      zIndex: 50,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '0.8125rem',
      fontWeight: 500,
      letterSpacing: '-0.01em',
      transition: 'all 0.2s ease'
    }}>
      <span style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: dot,
        boxShadow: \`0 0 8px \${dot}\`
      }} />
      <span>Backend: {text}</span>
    </div>
  )
}
`;
}

async function modifyNextJSPage(pageFile, isTypeScript) {
  let content = await fs.readFile(pageFile, 'utf-8');
  
  // Skip if already has BackendStatus
  if (content.includes('BackendStatus')) {
    return;
  }

  // Add import at the top (after 'use client' if present, or at the very top)
  const importStatement = `import BackendStatus from './components/BackendStatus'\n`;
  
  if (content.includes("'use client'") || content.includes('"use client"')) {
    content = content.replace(
      /(['"]use client['"][\s\n]*)/,
      `$1${importStatement}`
    );
  } else {
    content = importStatement + content;
  }

  // Try to add component after first opening tag in return
  // Look for patterns like: return ( <main or return ( <div
  const returnPattern = /(return\s*\(\s*<[a-zA-Z][^>]*>)/;
  if (returnPattern.test(content)) {
    content = content.replace(
      returnPattern,
      `$1\n      <BackendStatus />`
    );
  }

  await fs.writeFile(pageFile, content);
}

// ============== REACT + VITE ==============
async function injectReactVite(frontendPath, isTypeScript) {
  const ext = isTypeScript ? 'tsx' : 'jsx';
  
  // Create components directory
  const componentsDir = path.join(frontendPath, 'src', 'components');
  await fs.ensureDir(componentsDir);

  // Create BackendStatus component
  const componentCode = getReactBackendStatusCode(isTypeScript);
  await fs.writeFile(
    path.join(componentsDir, `BackendStatus.${ext}`),
    componentCode
  );

  // Try to modify App file
  const srcDir = path.join(frontendPath, 'src');
  const appFile = await findFile(srcDir, `App.${ext}`);
  if (appFile) {
    await modifyReactApp(appFile);
  }
}

function getReactBackendStatusCode(isTypeScript) {
  if (isTypeScript) {
    return `import { useEffect, useState } from 'react'

type Status = 'checking' | 'connected' | 'disconnected'

export default function BackendStatus() {
  const [status, setStatus] = useState<Status>('checking')
  
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/health')
        setStatus(res.ok ? 'connected' : 'disconnected')
      } catch {
        setStatus('disconnected')
      }
    }
    
    checkBackend()
    const interval = setInterval(checkBackend, 5000)
    return () => clearInterval(interval)
  }, [])
  
  const statusConfig = {
    checking: { dot: '#fbbf24', text: 'Checking...' },
    connected: { dot: '#22c55e', text: 'Connected' },
    disconnected: { dot: '#ef4444', text: 'Disconnected' }
  }
  
  const { dot, text } = statusConfig[status]
  
  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: 'rgba(255, 255, 255, 0.9)',
      padding: '0.5rem 0.875rem',
      borderRadius: '9999px',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      zIndex: 50,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '0.8125rem',
      fontWeight: 500
    }}>
      <span style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: dot,
        boxShadow: \`0 0 8px \${dot}\`
      }} />
      <span>Backend: {text}</span>
    </div>
  )
}
`;
  }

  return `import { useEffect, useState } from 'react'

export default function BackendStatus() {
  const [status, setStatus] = useState('checking')
  
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/health')
        setStatus(res.ok ? 'connected' : 'disconnected')
      } catch {
        setStatus('disconnected')
      }
    }
    
    checkBackend()
    const interval = setInterval(checkBackend, 5000)
    return () => clearInterval(interval)
  }, [])
  
  const statusConfig = {
    checking: { dot: '#fbbf24', text: 'Checking...' },
    connected: { dot: '#22c55e', text: 'Connected' },
    disconnected: { dot: '#ef4444', text: 'Disconnected' }
  }
  
  const { dot, text } = statusConfig[status]
  
  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: 'rgba(255, 255, 255, 0.9)',
      padding: '0.5rem 0.875rem',
      borderRadius: '9999px',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      zIndex: 50,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '0.8125rem',
      fontWeight: 500
    }}>
      <span style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: dot,
        boxShadow: \`0 0 8px \${dot}\`
      }} />
      <span>Backend: {text}</span>
    </div>
  )
}
`;
}

async function modifyReactApp(appFile) {
  let content = await fs.readFile(appFile, 'utf-8');
  
  if (content.includes('BackendStatus')) {
    return;
  }

  // Add import
  const importStatement = `import BackendStatus from './components/BackendStatus'\n`;
  
  // Find the last import and add after it
  const importRegex = /^import .+ from .+$/gm;
  let lastImportIndex = 0;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    lastImportIndex = match.index + match[0].length;
  }
  
  if (lastImportIndex > 0) {
    content = content.slice(0, lastImportIndex) + '\n' + importStatement + content.slice(lastImportIndex);
  } else {
    content = importStatement + content;
  }

  // Add component after first tag in return
  const returnPattern = /(return\s*\(\s*<[a-zA-Z][^>]*>)/;
  if (returnPattern.test(content)) {
    content = content.replace(
      returnPattern,
      `$1\n      <BackendStatus />`
    );
  }

  await fs.writeFile(appFile, content);
}

// ============== SVELTE ==============
async function injectSvelte(frontendPath, isTypeScript) {
  const ext = isTypeScript ? 'ts' : 'js';
  
  // Create lib/components directory
  const componentsDir = path.join(frontendPath, 'src', 'lib', 'components');
  await fs.ensureDir(componentsDir);

  // Create BackendStatus component
  const componentCode = getSvelteBackendStatusCode();
  await fs.writeFile(
    path.join(componentsDir, 'BackendStatus.svelte'),
    componentCode
  );

  // Try to modify +page.svelte
  const routesDir = path.join(frontendPath, 'src', 'routes');
  const pageFile = path.join(routesDir, '+page.svelte');
  
  if (await fs.pathExists(pageFile)) {
    await modifySveltePage(pageFile);
  }
}

function getSvelteBackendStatusCode() {
  return `<script>
  import { onMount, onDestroy } from 'svelte';
  
  let status = 'checking';
  let interval;
  
  const statusConfig = {
    checking: { text: 'Checking', color: '#eab308' },
    connected: { text: 'Connected', color: '#22c55e' },
    disconnected: { text: 'Disconnected', color: '#ef4444' }
  };
  
  async function checkBackend() {
    try {
      const res = await fetch('http://localhost:5000/api/health');
      status = res.ok ? 'connected' : 'disconnected';
    } catch {
      status = 'disconnected';
    }
  }
  
  onMount(() => {
    checkBackend();
    interval = setInterval(checkBackend, 5000);
  });
  
  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
  
  $: config = statusConfig[status];
</script>

<div class="backend-status">
  <span class="dot" style="background-color: {config.color}; box-shadow: 0 0 8px {config.color};"></span>
  <span class="text">Backend: {config.text}</span>
</div>

<style>
  .backend-status {
    position: fixed;
    top: 1rem;
    right: 1rem;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: rgba(255, 255, 255, 0.9);
    padding: 0.5rem 0.875rem;
    border-radius: 9999px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.3);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    z-index: 50;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 0.75rem;
  }
  
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  
  .text {
    font-weight: 500;
  }
</style>
`;
}

async function modifySveltePage(pageFile) {
  let content = await fs.readFile(pageFile, 'utf-8');
  
  if (content.includes('BackendStatus')) {
    return;
  }

  // Check if there's a script tag
  if (content.includes('<script')) {
    // Add import inside existing script
    content = content.replace(
      /<script([^>]*)>/,
      `<script$1>\n  import BackendStatus from '$lib/components/BackendStatus.svelte';`
    );
  } else {
    // Add script tag at the top
    content = `<script>\n  import BackendStatus from '$lib/components/BackendStatus.svelte';\n</script>\n\n` + content;
  }

  // Add component at the end
  content = content + '\n\n<BackendStatus />\n';

  await fs.writeFile(pageFile, content);
}

// ============== HELPERS ==============
async function findFile(dir, filename) {
  try {
    const files = await fs.readdir(dir);
    if (files.includes(filename)) {
      return path.join(dir, filename);
    }
    return null;
  } catch {
    return null;
  }
}
