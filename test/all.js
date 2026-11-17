/**
 * Raqeeb Master Coordinator
 * Tool: Alagadjeebak Raqeeb (على قد جيبك رقيب)
 * Target AI Inspector: Antigravity
 * Note: Terminal outputs are strictly in English per Raqeeb specification.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec, execSync } = require('child_process');

const { colors, banner, progressBar, spinnerFrames, celebration } = require('./ascii_art');
const { runStaticChecks } = require('./static_checks');
const { runLogicChecks } = require('./logic_checks');
const { runMultiplayerSimulation } = require('./simulation_robot');
const { AI_NAME, TOOL_NAME, RAQEEB_FULL_NAME, generateReports } = require('./reporter');
const WaseetBridge = require('./waseet_bridge');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const COLLECTED_DIR = path.join(PROJECT_ROOT, 'collected');
const AUTO_LOG_PATH = path.join(COLLECTED_DIR, 'auto.log');

// Set Windows Terminal Title
function setTerminalTitle(title) {
  process.stdout.write(`\x1b]0;${title}\x07`);
}

function notifyUser(title, message) {
  try {
    process.stdout.write('\x07'); // System audio beep
    if (process.platform === 'win32') {
      const psCmd = `[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null; $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02); $textNodes = $template.GetElementsByTagName('text'); $textNodes.Item(0).AppendChild($template.CreateTextNode('${title}')) > $null; $textNodes.Item(1).AppendChild($template.CreateTextNode('${message}')) > $null; $toast = [Windows.UI.Notifications.ToastNotification]::new($template); [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('${TOOL_NAME}').Show($toast);`;
      exec(`powershell -NoProfile -Command "${psCmd}"`, { stdio: 'ignore' });
    }
  } catch (e) {}
}

async function main() {
  const args = process.argv.slice(2);
  const isAuto = args.includes('--auto');
  const isRunNow = args.includes('--run-now');

  setTerminalTitle(`${TOOL_NAME} رقيب — Running`);

  if (!fs.existsSync(COLLECTED_DIR)) {
    fs.mkdirSync(COLLECTED_DIR, { recursive: true });
  }

  function logAuto(msg) {
    const entry = `[${new Date().toISOString()}] ${msg}\n`;
    fs.appendFileSync(AUTO_LOG_PATH, entry, 'utf8');
  }

  if (isAuto) {
    logAuto(`Starting silent auto run of ${RAQEEB_FULL_NAME} (AI: ${AI_NAME})`);
  } else {
    console.clear();
    console.log(banner(AI_NAME));
  }

  // 15-minute global watchdog timer
  const globalWatchdog = setTimeout(() => {
    console.error(`\n${colors.red}[RAQEEB] Global 15-minute timeout reached. Aborting.${colors.reset}`);
    process.exit(1);
  }, 15 * 60 * 1000);

  const testResults = [];
  const waseet = new WaseetBridge(AI_NAME);

  try {
    // Stage 1: Static Audits & File Integrity (0% -> 30%)
    if (!isAuto) {
      console.log(`\n${colors.cyan}[1/3] Running Static Code Integrity & Security Audits...${colors.reset}`);
      console.log(progressBar(10));
    }
    const staticRes = await runStaticChecks();
    testResults.push(...staticRes);

    staticRes.forEach(t => {
      if (!isAuto) {
        console.log(`  ${t.passed ? colors.green + '✔' : colors.red + '✖'} ${t.name} (${t.durationMs}ms)${colors.reset}`);
      }
    });

    if (!isAuto) console.log(progressBar(35));

    // Stage 2: Logic & Ruleset Verification (35% -> 70%)
    if (!isAuto) {
      console.log(`\n${colors.cyan}[2/3] Running Game Logic & Tie-Breaker Engine Checks...${colors.reset}`);
    }
    const logicRes = await runLogicChecks();
    testResults.push(...logicRes);

    logicRes.forEach(t => {
      if (!isAuto) {
        console.log(`  ${t.passed ? colors.green + '✔' : colors.red + '✖'} ${t.name} (${t.durationMs}ms)${colors.reset}`);
      }
    });

    if (!isAuto) console.log(progressBar(70));

    // Stage 3: Live Multiplayer Simulation Robot (70% -> 100%)
    if (!isAuto) {
      console.log(`\n${colors.cyan}[3/3] Launching Realtime Multiplayer Simulation Robot...${colors.reset}`);
    }
    const simRes = await runMultiplayerSimulation();
    testResults.push(simRes);

    if (!isAuto) {
      console.log(`  ${simRes.passed ? colors.green + '✔' : colors.red + '✖'} ${simRes.name} (${simRes.durationMs}ms)${colors.reset}`);
      console.log(progressBar(100));
    }

    clearTimeout(globalWatchdog);

    // Generate Reports
    const reportOutcome = generateReports(testResults);
    await waseet.syncToWaseet(reportOutcome.runId);

    if (reportOutcome.allPassed) {
      setTerminalTitle(`${TOOL_NAME} رقيب — All Passed ✅`);
      notifyUser(`${TOOL_NAME} رقيب`, 'جميع الفحوصات والمحاكاة نجحت بنسبة 100% بنجاح!');
      if (!isAuto) {
        console.log(celebration());
        console.log(`\n${colors.green}${colors.bold}[SUCCESS] All ${reportOutcome.total} checks passed flawlessly!${colors.reset}`);
        console.log(`${colors.white}HTML Report: file://${reportOutcome.htmlPath.replace(/\\/g, '/')}${colors.reset}`);
        console.log(`${colors.white}AI Report:   file://${reportOutcome.textReportPath.replace(/\\/g, '/')}${colors.reset}\n`);
      } else {
        logAuto(`SUCCESS: All ${reportOutcome.total} checks passed.`);
      }
    } else {
      setTerminalTitle(`${TOOL_NAME} رقيب — Failures Detected ⚠️`);
      notifyUser(`${TOOL_NAME} رقيب`, `تم رصد تعثر في ${reportOutcome.failed} من أصل ${reportOutcome.total} فحص!`);
      if (!isAuto) {
        console.log(`\n${colors.red}${colors.bold}[ACTION REQUIRED] ${reportOutcome.failed} checks failed. Report saved for ${AI_NAME}.${colors.reset}\n`);
      } else {
        logAuto(`FAIL: ${reportOutcome.failed} checks failed.`);
      }
    }

    if (isAuto) {
      process.exit(reportOutcome.allPassed ? 0 : 1);
    }

    // Interactive Menu (Section 9 of specification)
    await showMenu(reportOutcome, waseet);

  } catch (fatalErr) {
    clearTimeout(globalWatchdog);
    console.error(`\n${colors.red}[FATAL] Raqeeb encountered an unexpected failure: ${fatalErr.message}${colors.reset}`);
    if (isAuto) logAuto(`FATAL: ${fatalErr.message}`);
    process.exit(1);
  }
}

async function showMenu(reportOutcome, waseet) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const promptUser = () => {
    console.log(`\n${colors.yellow}${colors.bold}======================================================================${colors.reset}`);
    console.log(`${colors.bold}RAQEEB COMMAND MENU:${colors.reset}`);
    console.log(`  ${colors.cyan}[6]${colors.reset} OPEN REPORT (Opens visual HTML dashboard in your browser)`);
    console.log(`  ${colors.cyan}[7]${colors.reset} RUN ANOTHER CHECK (Re-executes all static & live simulation tests)`);
    console.log(`  ${colors.cyan}[W]${colors.reset} WAIT FOR AI ANSWER (Polls Waseet bridge for ${AI_NAME}'s response)`);
    console.log(`  ${colors.cyan}[Q]${colors.reset} QUIT`);
    console.log(`${colors.yellow}${colors.bold}======================================================================${colors.reset}`);

    rl.question(`${colors.bold}Select an option [6 / 7 / W / Q]: ${colors.reset}`, async (answer) => {
      const choice = (answer || '').trim().toUpperCase();

      if (choice === '6') {
        const startCmd = process.platform === 'win32' ? 'start ""' : 'open';
        exec(`${startCmd} "${reportOutcome.htmlPath}"`);
        console.log(`${colors.green}Opened report in default browser.${colors.reset}`);
        promptUser();
      } else if (choice === '7') {
        rl.close();
        main();
      } else if (choice === 'W') {
        await pollWaseetAnswer(reportOutcome.runId, waseet);
        promptUser();
      } else if (choice === 'Q') {
        console.log(`${colors.cyan}Exiting Raqeeb. Goodbye!${colors.reset}`);
        rl.close();
        process.exit(0);
      } else {
        console.log(`${colors.red}Invalid option. Please choose 6, 7, W, or Q.${colors.reset}`);
        promptUser();
      }
    });
  };

  promptUser();
}

async function pollWaseetAnswer(runId, waseet) {
  console.log(`\n${colors.cyan}Polling Waseet bridge for answer from ${AI_NAME} (Press Ctrl+C to cancel)...${colors.reset}`);
  let frame = 0;

  for (let i = 0; i < 20; i++) {
    const answer = waseet.checkAnswer(runId);
    if (answer) {
      console.log(`\n${colors.green}${colors.bold}✔ Answer received from ${AI_NAME}!${colors.reset}`);
      console.log(`\n${colors.white}${answer}${colors.reset}\n`);
      return;
    }
    process.stdout.write(`\r${colors.yellow}${spinnerFrames[frame % spinnerFrames.length]} Waiting for answer... (${20 - i} checks remaining)${colors.reset}`);
    frame++;
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n${colors.yellow}No new answer found in Waseet yet. Check again later.${colors.reset}`);
}

if (require.main === module) {
  main();
}
