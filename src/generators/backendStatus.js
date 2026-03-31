import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import ora from 'ora';

export async function injectBackendStatus(frontendPath, framework, isTypeScript, isIntegrated, backendUrl) {
  const spinner = ora({ text: 'Adding BackendStatus component...', color: 'cyan' }).start();

  try {
    switch (framework) {
      case 'nextjs':
        await injectNextJS(frontendPath, isTypeScript, isIntegrated);
        break;
      case 'react-vite':
        await injectReactVite(frontendPath, isTypeScript, backendUrl);
        break;
      case 'svelte':
        await injectSvelte(frontendPath, backendUrl);
        break;
    }
    spinner.succeed(chalk.dim('BackendStatus component added'));
  } catch (error) {
    spinner.warn(chalk.yellow(`Could not auto-inject BackendStatus: ${error.message}`));
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
    await modifyNextJSPage(pageFile);
  }
}

function getNextJSBackendStatusCode(isTypeScript, backendUrl) {
  if (isTypeScript) {
    return `'use client'
import { useEffect, useState } from 'react'

type Status = 'checking' | 'connected' | 'disconnected'

export default function BackendStatus() {
  const [backendStatus, setBackendStatus] = useState<Status>('checking')
  const [dbStatus, setDbStatus] = useState<Status | null>(null)
  
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('${backendUrl}')
        if (res.ok) {
          const data = await res.json()
          setBackendStatus('connected')
          if (typeof data.database === 'boolean') {
            setDbStatus(data.database ? 'connected' : 'disconnected')
          }
        } else {
          setBackendStatus('disconnected')
          setDbStatus(prev => prev !== null ? 'disconnected' : null)
        }
      } catch {
        setBackendStatus('disconnected')
        setDbStatus(prev => prev !== null ? 'disconnected' : null)
      }
    }
    
    checkHealth()
    const interval = setInterval(checkHealth, 5000)
    return () => clearInterval(interval)
  }, [])
  
  const colors: Record<Status, string> = {
    checking: '#fbbf24',
    connected: '#22c55e',
    disconnected: '#ef4444'
  }
  
  const labels: Record<Status, string> = {
    checking: 'Checking...',
    connected: 'Connected',
    disconnected: 'Disconnected'
  }
  
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
      borderRadius: '0.75rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.375rem',
      zIndex: 50,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '0.8125rem',
      fontWeight: 500,
      letterSpacing: '-0.01em',
      transition: 'all 0.2s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: colors[backendStatus],
          boxShadow: \`0 0 8px \${colors[backendStatus]}\`
        }} />
        <span>Backend: {labels[backendStatus]}</span>
      </div>
      {dbStatus && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: colors[dbStatus],
            boxShadow: \`0 0 8px \${colors[dbStatus]}\`
          }} />
          <span>Database: {labels[dbStatus]}</span>
        </div>
      )}
    </div>
  )
}
`;
  }

  return `'use client'
import { useEffect, useState } from 'react'

export default function BackendStatus() {
  const [backendStatus, setBackendStatus] = useState('checking')
  const [dbStatus, setDbStatus] = useState(null)
  
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('${backendUrl}')
        if (res.ok) {
          const data = await res.json()
          setBackendStatus('connected')
          if (typeof data.database === 'boolean') {
            setDbStatus(data.database ? 'connected' : 'disconnected')
          }
        } else {
          setBackendStatus('disconnected')
          setDbStatus(prev => prev !== null ? 'disconnected' : null)
        }
      } catch {
        setBackendStatus('disconnected')
        setDbStatus(prev => prev !== null ? 'disconnected' : null)
      }
    }
    
    checkHealth()
    const interval = setInterval(checkHealth, 5000)
    return () => clearInterval(interval)
  }, [])
  
  const colors = {
    checking: '#fbbf24',
    connected: '#22c55e',
    disconnected: '#ef4444'
  }
  
  const labels = {
    checking: 'Checking...',
    connected: 'Connected',
    disconnected: 'Disconnected'
  }
  
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
      borderRadius: '0.75rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.375rem',
      zIndex: 50,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '0.8125rem',
      fontWeight: 500,
      letterSpacing: '-0.01em',
      transition: 'all 0.2s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: colors[backendStatus],
          boxShadow: \`0 0 8px \${colors[backendStatus]}\`
        }} />
        <span>Backend: {labels[backendStatus]}</span>
      </div>
      {dbStatus && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: colors[dbStatus],
            boxShadow: \`0 0 8px \${colors[dbStatus]}\`
          }} />
          <span>Database: {labels[dbStatus]}</span>
        </div>
      )}
    </div>
  )
}
`;
}

async function modifyNextJSPage(pageFile) {
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
async function injectReactVite(frontendPath, isTypeScript, backendUrl) {
  const ext = isTypeScript ? 'tsx' : 'jsx';
  
  // Create components directory
  const componentsDir = path.join(frontendPath, 'src', 'components');
  await fs.ensureDir(componentsDir);

  // Create BackendStatus component
  const componentCode = getReactBackendStatusCode(isTypeScript, backendUrl);
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

function getReactBackendStatusCode(isTypeScript, backendUrl) {
  if (isTypeScript) {
    return `import { useEffect, useState } from 'react'

type Status = 'checking' | 'connected' | 'disconnected'

export default function BackendStatus() {
  const [backendStatus, setBackendStatus] = useState<Status>('checking')
  const [dbStatus, setDbStatus] = useState<Status | null>(null)
  
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('${backendUrl}')
        if (res.ok) {
          const data = await res.json()
          setBackendStatus('connected')
          if (typeof data.database === 'boolean') {
            setDbStatus(data.database ? 'connected' : 'disconnected')
          }
        } else {
          setBackendStatus('disconnected')
          setDbStatus(prev => prev !== null ? 'disconnected' : null)
        }
      } catch {
        setBackendStatus('disconnected')
        setDbStatus(prev => prev !== null ? 'disconnected' : null)
      }
    }
    
    checkHealth()
    const interval = setInterval(checkHealth, 5000)
    return () => clearInterval(interval)
  }, [])
  
  const colors: Record<Status, string> = {
    checking: '#fbbf24',
    connected: '#22c55e',
    disconnected: '#ef4444'
  }
  
  const labels: Record<Status, string> = {
    checking: 'Checking...',
    connected: 'Connected',
    disconnected: 'Disconnected'
  }
  
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
      borderRadius: '0.75rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.375rem',
      zIndex: 50,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '0.8125rem',
      fontWeight: 500
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: colors[backendStatus],
          boxShadow: \`0 0 8px \${colors[backendStatus]}\`
        }} />
        <span>Backend: {labels[backendStatus]}</span>
      </div>
      {dbStatus && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: colors[dbStatus],
            boxShadow: \`0 0 8px \${colors[dbStatus]}\`
          }} />
          <span>Database: {labels[dbStatus]}</span>
        </div>
      )}
    </div>
  )
}
`;
  }

  return `import { useEffect, useState } from 'react'

export default function BackendStatus() {
  const [backendStatus, setBackendStatus] = useState('checking')
  const [dbStatus, setDbStatus] = useState(null)
  
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('${backendUrl}')
        if (res.ok) {
          const data = await res.json()
          setBackendStatus('connected')
          if (typeof data.database === 'boolean') {
            setDbStatus(data.database ? 'connected' : 'disconnected')
          }
        } else {
          setBackendStatus('disconnected')
          setDbStatus(prev => prev !== null ? 'disconnected' : null)
        }
      } catch {
        setBackendStatus('disconnected')
        setDbStatus(prev => prev !== null ? 'disconnected' : null)
      }
    }
    
    checkHealth()
    const interval = setInterval(checkHealth, 5000)
    return () => clearInterval(interval)
  }, [])
  
  const colors = {
    checking: '#fbbf24',
    connected: '#22c55e',
    disconnected: '#ef4444'
  }
  
  const labels = {
    checking: 'Checking...',
    connected: 'Connected',
    disconnected: 'Disconnected'
  }
  
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
      borderRadius: '0.75rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.375rem',
      zIndex: 50,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '0.8125rem',
      fontWeight: 500
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: colors[backendStatus],
          boxShadow: \`0 0 8px \${colors[backendStatus]}\`
        }} />
        <span>Backend: {labels[backendStatus]}</span>
      </div>
      {dbStatus && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: colors[dbStatus],
            boxShadow: \`0 0 8px \${colors[dbStatus]}\`
          }} />
          <span>Database: {labels[dbStatus]}</span>
        </div>
      )}
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
async function injectSvelte(frontendPath, backendUrl) {
  
  // Create lib/components directory
  const componentsDir = path.join(frontendPath, 'src', 'lib', 'components');
  await fs.ensureDir(componentsDir);

  // Create BackendStatus component
  const componentCode = getSvelteBackendStatusCode(backendUrl);
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

function getSvelteBackendStatusCode(backendUrl) {
  return `<script>
  import { onMount, onDestroy } from 'svelte';
  
  let backendStatus = 'checking';
  let dbStatus = null;
  let interval;
  
  const colors = {
    checking: '#fbbf24',
    connected: '#22c55e',
    disconnected: '#ef4444'
  };
  
  const labels = {
    checking: 'Checking...',
    connected: 'Connected',
    disconnected: 'Disconnected'
  };
  
  async function checkHealth() {
    try {
      const res = await fetch('${backendUrl}');
      if (res.ok) {
        const data = await res.json();
        backendStatus = 'connected';
        if (typeof data.database === 'boolean') {
          dbStatus = data.database ? 'connected' : 'disconnected';
        }
      } else {
        backendStatus = 'disconnected';
        if (dbStatus !== null) dbStatus = 'disconnected';
      }
    } catch {
      backendStatus = 'disconnected';
      if (dbStatus !== null) dbStatus = 'disconnected';
    }
  }
  
  onMount(() => {
    checkHealth();
    interval = setInterval(checkHealth, 5000);
  });
  
  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
</script>

<div class="status-container">
  <div class="status-row">
    <span class="dot" style="background-color: {colors[backendStatus]}; box-shadow: 0 0 8px {colors[backendStatus]};"></span>
    <span class="text">Backend: {labels[backendStatus]}</span>
  </div>
  {#if dbStatus}
    <div class="status-row">
      <span class="dot" style="background-color: {colors[dbStatus]}; box-shadow: 0 0 8px {colors[dbStatus]};"></span>
      <span class="text">Database: {labels[dbStatus]}</span>
    </div>
  {/if}
</div>

<style>
  .status-container {
    position: fixed;
    top: 1rem;
    right: 1rem;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: rgba(255, 255, 255, 0.9);
    padding: 0.5rem 0.875rem;
    border-radius: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.3);
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    z-index: 50;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 0.75rem;
  }
  
  .status-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
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
