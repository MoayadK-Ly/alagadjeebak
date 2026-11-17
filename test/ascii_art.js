/**
 * Raqeeb Terminal ASCII Art & Visual Elements
 * Tool: Alagadjeebak Raqeeb (على قد جيبك رقيب)
 * Target AI Inspector: Antigravity
 * Note: Terminal outputs are strictly in English per Raqeeb specification.
 */

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  red: '\x1b[31m'
};

function banner(aiName = 'Antigravity') {
  return `
${colors.cyan}${colors.bold}======================================================================
  ██████╗  █████╗  ██████╗ ███████╗███████╗██████╗ 
  ██╔══██╗██╔══██╗██╔═══██╗██╔════╝██╔════╝██╔══██╗
  ██████╔╝███████║██║   ██║█████╗  █████╗  ██████╔╝
  ██╔══██╗██╔══██║██║▄▄ ██║██╔══╝  ██╔══╝  ██╔══██╗
  ██║  ██║██║  ██║╚██████╔╝███████╗███████╗██████╔╝
  ╚═╝  ╚═╝╚═╝  ╚═╝ ╚══▀▀═╝ ╚══════╝╚══════╝╚═════╝ 
  ALAGADJEEBAK RAQEEB — REALTIME AUDIT & SIMULATION SUITE
  Target AI Inspector: ${colors.yellow}${aiName}${colors.cyan}
======================================================================${colors.reset}
`;
}

function progressBar(percent, width = 32) {
  const p = Math.max(0, Math.min(100, percent));
  const filled = Math.round((p / 100) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `${colors.bold}[${colors.green}${bar}${colors.reset}${colors.bold}] ${p.toString().padStart(3, ' ')}%${colors.reset}`;
}

const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

function celebration() {
  return `
${colors.green}${colors.bold}
  **********************************************************************
  *                                                                    *
  *  ███████╗██╗   ██╗ ██████╗  ██████╗███████╗███████╗███████╗        *
  *  ██╔════╝██║   ██║██╔════╝ ██╔════╝██╔════╝██╔════╝██╔════╝        *
  *  ███████╗██║   ██║██║      ██║     █████╗  ███████╗███████╗        *
  *  ╚════██║██║   ██║██║      ██║     ██╔══╝  ╚════██║╚════██║        *
  *  ███████║╚██████╔╝╚██████╗ ╚██████╗███████╗███████║███████║        *
  *  ╚══════╝ ╚═════╝  ╚═════╝  ╚═════╝╚══════╝╚══════╝╚══════╝        *
  *                                                                    *
  *            ALL CHECKS & REALTIME SIMULATIONS PASSED!               *
  **********************************************************************
${colors.reset}`;
}

module.exports = {
  colors,
  banner,
  progressBar,
  spinnerFrames,
  celebration
};
