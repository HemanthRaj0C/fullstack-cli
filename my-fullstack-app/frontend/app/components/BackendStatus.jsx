'use client'
import { useEffect, useState } from 'react'

export default function BackendStatus() {
  const [backendStatus, setBackendStatus] = useState('checking')
  const [dbStatus, setDbStatus] = useState(null)
  
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/health')
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
          boxShadow: `0 0 8px ${colors[backendStatus]}`
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
            boxShadow: `0 0 8px ${colors[dbStatus]}`
          }} />
          <span>Database: {labels[dbStatus]}</span>
        </div>
      )}
    </div>
  )
}
