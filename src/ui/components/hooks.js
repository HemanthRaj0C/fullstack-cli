import { useState } from 'react';

export function useSelection() {
  const [selections, setSelections] = useState({
    frontend: null,
    backend: null,
    database: null,
  });

  const updateSelection = (key, value) => {
    setSelections((prev) => ({ ...prev, [key]: value }));
  };

  return { selections, updateSelection };
}

export function useOutput() {
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info', phase = 'info') => {
    setLogs((prev) => [...prev, { message, type, phase, timestamp: Date.now() }]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogsByPhase = (phase) => {
    return logs.filter(log => log.phase === phase);
  };

  return { logs, addLog, clearLogs, getLogsByPhase };
}

export function useProgress() {
  const [steps, setSteps] = useState({
    preflight: 'pending',
    frontend: 'pending',
    backend: 'pending',
    backendStatus: 'pending',
  });

  const updateStep = (stepName, status) => {
    setSteps((prev) => ({ ...prev, [stepName]: status }));
  };

  return { steps, updateStep };
}
