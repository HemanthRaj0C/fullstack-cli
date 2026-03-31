import React, { useState, useEffect } from 'react';
import { Box, Text, useStdout } from 'ink';
import { 
  colors, 
  bootMessages, 
  logoSimple, 
  tagline, 
  version,
  box,
} from '../theme.js';

/**
 * BootScreen - Animated initialization screen with retro terminal aesthetics
 */
export function BootScreen({ onComplete, projectName = '' }) {
  const [bootStep, setBootStep] = useState(0);
  const [showLogo, setShowLogo] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [ready, setReady] = useState(false);
  const { stdout } = useStdout();
  
  const termWidth = stdout?.columns || 80;

  // Animate boot sequence
  useEffect(() => {
    if (bootStep < bootMessages.length) {
      const timer = setTimeout(() => {
        setBootStep(prev => prev + 1);
      }, 300);
      return () => clearTimeout(timer);
    } else if (!showLogo) {
      const timer = setTimeout(() => {
        setShowLogo(true);
      }, 200);
      return () => clearTimeout(timer);
    } else if (!showPrompt) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
        setReady(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [bootStep, showLogo, showPrompt]);

  // Auto-proceed when ready
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      onComplete();
    }, 800);
    return () => clearTimeout(timer);
  }, [ready, onComplete]);

  // Render boot messages
  const bootMessageElements = bootMessages.slice(0, bootStep).map((msg, idx) => {
    const statusColor = colors.success;
    return React.createElement(
      Box,
      { key: idx, flexDirection: 'row', gap: 1 },
      React.createElement(Text, { color: colors.text }, msg.text),
      React.createElement(Text, { color: statusColor, bold: true }, msg.status)
    );
  });

  // Logo lines
  const logoLines = logoSimple.split('\n').filter(line => line.length > 0);
  const logoElements = showLogo ? logoLines.map((line, idx) =>
    React.createElement(Text, { key: idx, color: colors.primary }, line)
  ) : [];

  return React.createElement(
    Box,
    { flexDirection: 'column', padding: 2 },
    // Header
    React.createElement(
      Box,
      { 
        borderStyle: 'single',
        borderColor: colors.muted,
        paddingX: 2,
        marginBottom: 1,
        width: 30,
      },
      React.createElement(Text, { color: colors.muted }, 'TTY1 - ROOT@DEV')
    ),
    // Boot messages
    React.createElement(
      Box,
      { flexDirection: 'column', marginTop: 1 },
      ...bootMessageElements
    ),
    // System ready
    bootStep >= bootMessages.length && React.createElement(
      Box,
      { marginTop: 1 },
      React.createElement(Text, { color: colors.text, bold: true }, 'SYSTEM READY.')
    ),
    // Logo
    showLogo && React.createElement(
      Box,
      { flexDirection: 'column', marginTop: 2 },
      ...logoElements
    ),
    // Tagline
    showLogo && React.createElement(
      Box,
      { flexDirection: 'column', marginTop: 1, marginLeft: 2 },
      React.createElement(
        Box,
        { flexDirection: 'row', gap: 1 },
        React.createElement(Text, { color: colors.secondary }, '│'),
        React.createElement(Text, { color: colors.text }, tagline)
      ),
      React.createElement(
        Box,
        { marginLeft: 2 },
        React.createElement(Text, { color: colors.muted }, version)
      )
    ),
    // Command prompt
    showPrompt && React.createElement(
      Box,
      { flexDirection: 'column', marginTop: 2 },
      React.createElement(
        Box,
        {
          borderStyle: 'single',
          borderColor: colors.muted,
          paddingX: 1,
          width: 50,
        },
        React.createElement(
          Box,
          { flexDirection: 'row', gap: 1 },
          React.createElement(Text, { color: colors.primary, bold: true }, 'root@dev:~$'),
          React.createElement(Text, { color: colors.secondary }, `npx create-fs-cli${projectName ? ` ${projectName}` : ''}`),
          React.createElement(Text, { color: colors.primary, inverse: true }, ' ')
        )
      ),
      React.createElement(
        Box,
        { justifyContent: 'center', marginTop: 1, width: 50 },
        React.createElement(
          Text,
          { color: colors.primary, bold: true, inverse: ready },
          '[ EXECUTE ]'
        )
      )
    ),
    // Status bar
    React.createElement(
      Box,
      { 
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 2,
        width: Math.min(60, termWidth - 4),
      },
      React.createElement(
        Box,
        { flexDirection: 'row', gap: 1 },
        React.createElement(Text, { color: colors.success }, '●'),
        React.createElement(Text, { color: colors.muted }, 'MEM: 24MB/128MB')
      ),
      React.createElement(
        Text,
        { color: ready ? colors.success : colors.warning },
        ready ? 'READY' : 'INITIALIZING...'
      )
    )
  );
}

/**
 * LoadingSpinner - Animated spinner for loading states
 */
export function LoadingSpinner({ label = 'Loading...' }) {
  const [frame, setFrame] = useState(0);
  const spinnerChars = ['◐', '◓', '◑', '◒'];

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame(prev => (prev + 1) % spinnerChars.length);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  return React.createElement(
    Box,
    { flexDirection: 'row', gap: 1 },
    React.createElement(Text, { color: colors.secondary }, spinnerChars[frame]),
    React.createElement(Text, { color: colors.text }, label)
  );
}
