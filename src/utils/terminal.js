export function restoreTerminalState() {
  // Ensure stdin is no longer in raw mode before process exits.
  try {
    if (process.stdin.isTTY && typeof process.stdin.setRawMode === 'function') {
      process.stdin.setRawMode(false);
    }
  } catch {
    // Ignore raw-mode reset failures.
  }

  try {
    process.stdin.pause();
  } catch {
    // Ignore stdin pause failures.
  }

  // Reset common terminal modes that can break shell prompt animations.
  const resetSequence =
    '\x1b[0m' + // reset styles
    '\x1b[?25h' + // show cursor
    '\x1b[?2004l' + // disable bracketed paste
    '\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1004l\x1b[?1005l\x1b[?1006l' + // disable mouse tracking
    '\x1b[?47l\x1b[?1047l\x1b[?1048l\x1b[?1049l'; // ensure normal screen buffer

  try {
    if (process.stdout?.isTTY) {
      process.stdout.write(resetSequence);
    }
  } catch {
    // Ignore stdout reset failures.
  }

  try {
    if (process.stderr?.isTTY) {
      process.stderr.write('\x1b[0m\x1b[?25h');
    }
  } catch {
    // Ignore stderr reset failures.
  }
}

export function installNonTuiTerminalGuards(onInterrupt) {
  let shutdownInProgress = false;

  const handleInterrupt = (signal) => {
    if (shutdownInProgress) return;
    shutdownInProgress = true;

    restoreTerminalState();

    if (typeof onInterrupt === 'function') {
      onInterrupt(signal);
    }

    process.exit(signal === 'SIGINT' ? 130 : 143);
  };

  const handleExit = () => {
    restoreTerminalState();
  };

  const handleUncaughtExceptionMonitor = () => {
    restoreTerminalState();
  };

  const handleSigint = () => handleInterrupt('SIGINT');
  const handleSigterm = () => handleInterrupt('SIGTERM');

  process.on('SIGINT', handleSigint);
  process.on('SIGTERM', handleSigterm);
  process.on('beforeExit', handleExit);
  process.on('exit', handleExit);
  process.on('uncaughtExceptionMonitor', handleUncaughtExceptionMonitor);

  return () => {
    process.removeListener('SIGINT', handleSigint);
    process.removeListener('SIGTERM', handleSigterm);
    process.removeListener('beforeExit', handleExit);
    process.removeListener('exit', handleExit);
    process.removeListener('uncaughtExceptionMonitor', handleUncaughtExceptionMonitor);
  };
}
