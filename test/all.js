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

const { colors, banner, progressBar, celebration } = require('./ascii_art');
const { runStaticChecks } = require('./static_checks');
const { runLogicChecks } = require('./logic_checks');
const { runMultiplayerSimulation } = require('./simulation_robot');
const { AI_NAME, TOOL_NAME, RAQEEB_FULL_NAME, generateReports } = require('./reporter');
const WaseetBridge = require('./waseet_bridge');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const COLLECTED_DIR = path.join(PROJECT_ROOT, 'collected');
const AUTO_LOG_PATH = path.join(COLLECTED_DIR, 'auto.log');

function setTerminalTitle(titleText) {
  try {
    if (process.platform === 'win32') {
      execSync(`chcp 65001 > nul && title ${titleText}`, { stdio: 'ignore' });
    } else {
      process.stdout.write(`\x1b]0;${titleText}\x07`);
    }
  } catch (e) {}
}

function notifyUser(title, message) {
  try {
    process.stdout.write('\x07');
    if (process.platform === 'win32') {
      const psCmd = `[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null; $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02); $textNodes = $template.GetElementsByTagName('text'); $textNodes.Item(0).AppendChild($template.CreateTextNode('${title}')) > $null; $textNodes.Item(1).AppendChild($template.CreateTextNode('${message}')) > $null; $toast = [Windows.UI.Notifications.ToastNotification]::new($template); [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('${TOOL_NAME}').Show($toast);`;
      exec(`powershell -NoProfile -Command "${psCmd}"`, { stdio: 'ignore' });
    }
  } catch (e) {}
}

async function main() {
  const args = process.argv.slice(2);
  const isAuto = args.includes('--auto');

  setTerminalTitle(`${RAQEEB_FULL_NAME} — يعمل`);

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

  const globalWatchdog = setTimeout(() => {
    console.error(`\n${colors.red}[RAQEEB] Global 15-minute watchdog timeout reached. Aborting.${colors.reset}`);
    process.exit(1);
  }, 15 * 60 * 1000);

  const testResults = [];
  const waseet = new WaseetBridge(AI_NAME);

  try {
    // -------------------------------------------------------------
    // STAGE 1: STATIC CODE INTEGRITY & SECURITY AUDITS
    // -------------------------------------------------------------
    if (!isAuto) {
      console.log(`${colors.cyan}${colors.bold}[STAGE 1/3] STATIC CODE INTEGRITY & SECURITY AUDITS${colors.reset}`);
    }
    const staticRes = await runStaticChecks();
    testResults.push(...staticRes);

    if (!isAuto) {
      staticRes.forEach(t => {
        const mark = t.passed ? `${colors.green}[✔]${colors.reset}` : `${colors.red}[✖]${colors.reset}`;
        console.log(`  ${mark} ${t.name} ${colors.dim}(${t.durationMs}ms)${colors.reset}`);
      });
      console.log(`  Progress: ${progressBar(35)}\n`);
    }

    // -------------------------------------------------------------
    // STAGE 2: GAMEPLAY LOGIC & RULESET VERIFICATION
    // -------------------------------------------------------------
    if (!isAuto) {
      console.log(`${colors.cyan}${colors.bold}[STAGE 2/3] GAMEPLAY LOGIC & RULESET VERIFICATION${colors.reset}`);
    }
    const logicRes = await runLogicChecks();
    testResults.push(...logicRes);

    if (!isAuto) {
      logicRes.forEach(t => {
        const mark = t.passed ? `${colors.green}[✔]${colors.reset}` : `${colors.red}[✖]${colors.reset}`;
        console.log(`  ${mark} ${t.name} ${colors.dim}(${t.durationMs}ms)${colors.reset}`);
      });
      console.log(`  Progress: ${progressBar(70)}\n`);
    }

    // -------------------------------------------------------------
    // STAGE 3: REALTIME MULTIPLAYER SIMULATION ROBOT
    // -------------------------------------------------------------
    if (!isAuto) {
      console.log(`${colors.cyan}${colors.bold}[STAGE 3/3] REALTIME MULTIPLAYER SIMULATION ROBOT${colors.reset}`);
    }
    const simRes = await runMultiplayerSimulation();
    testResults.push(simRes);

    if (!isAuto) {
      const mark = simRes.passed ? `${colors.green}[✔]${colors.reset}` : `${colors.red}[✖]${colors.reset}`;
      console.log(`  ${mark} ${simRes.name} ${colors.dim}(${simRes.durationMs}ms)${colors.reset}`);
      
      // Print detailed breakdown of simulation steps if passed
      if (simRes.details) {
        simRes.details.split('\n').filter(Boolean).forEach(line => {
          const cleanLine = line.replace(/\[\d{4}-\d{2}-\d{2}T.*?\]\s*/, '');
          console.log(`      ${colors.dim}↳ ${cleanLine}${colors.reset}`);
        });
      }
      console.log(`  Progress: ${progressBar(100)}\n`);
    }

    clearTimeout(globalWatchdog);

    // Generate Reports and Sync to Waseet
    const reportOutcome = generateReports(testResults);
    await waseet.syncToWaseet(reportOutcome.runId);

    // -------------------------------------------------------------
    // FINAL OUTCOME & CELEBRATION
    // -------------------------------------------------------------
    if (reportOutcome.allPassed) {
      setTerminalTitle(`${RAQEEB_FULL_NAME} — اكتمل بنجاح`);
      notifyUser(RAQEEB_FULL_NAME, 'جميع الفحوصات والمحاكاة نجحت بنسبة 100% بنجاح!');

      if (!isAuto) {
        console.log(celebration());
        console.log(`${colors.green}${colors.bold}[SUMMARY] ALL 12 CHECKS & REALTIME SIMULATIONS PASSED!${colors.reset}`);
        console.log(`${colors.white}  • Total Tests: ${reportOutcome.total} | Passed: ${reportOutcome.passed} | Failed: 0`);
        console.log(`  • Execution Duration: ${testResults.reduce((acc, t) => acc + (t.durationMs || 0), 0)}ms`);
        console.log(`  • Visual Report:  file://${reportOutcome.htmlPath.replace(/\\/g, '/')}`);
        console.log(`  • AI Text Report: file://${reportOutcome.textReportPath.replace(/\\/g, '/')}${colors.reset}\n`);
      } else {
        logAuto(`SUCCESS: All ${reportOutcome.total} checks passed.`);
      }
    } else {
      setTerminalTitle(`${RAQEEB_FULL_NAME} — تعثر الفحص`);
      notifyUser(RAQEEB_FULL_NAME, `تم رصد تعثر في ${reportOutcome.failed} من أصل ${reportOutcome.total} فحص!`);

      if (!isAuto) {
        console.log(`\n${colors.red}${colors.bold}[FAILURES DETECTED] ${reportOutcome.failed} checks failed.${colors.reset}`);
        console.log(`${colors.white}  • Action: Report generated for ${AI_NAME} at ${reportOutcome.textReportPath}${colors.reset}\n`);
      } else {
        logAuto(`FAIL: ${reportOutcome.failed} checks failed.`);
      }
    }

    if (isAuto) {
      process.exit(reportOutcome.allPassed ? 0 : 1);
    }

    // Section 6 & 9 Standard Menu
    await showMenu(reportOutcome);

  } catch (err) {
    clearTimeout(globalWatchdog);
    console.error(`\n${colors.red}[FATAL] Unexpected error: ${err.message}${colors.reset}`);
    if (isAuto) logAuto(`FATAL: ${err.message}`);
    process.exit(1);
  }
}

async function showMenu(reportOutcome) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const promptUser = () => {
    console.log(`${colors.yellow}======================================================================${colors.reset}`);
    console.log(`${colors.bold}RAQEEB COMMAND MENU:${colors.reset}`);
    console.log(`  ${colors.cyan}[6]${colors.reset} OPEN REPORT       (Opens visual HTML report in your browser)`);
    console.log(`  ${colors.cyan}[7]${colors.reset} RUN ANOTHER CHECK (Re-executes all checks & simulation)`);
    console.log(`  ${colors.cyan}[Q]${colors.reset} QUIT              (Exit Raqeeb)`);
    console.log(`${colors.yellow}======================================================================${colors.reset}`);

    rl.question(`${colors.bold}Select an option [6 / 7 / Q]: ${colors.reset}`, (answer) => {
      const choice = (answer || '').trim().toUpperCase();

      if (choice === '6') {
        const startCmd = process.platform === 'win32' ? 'start ""' : 'open';
        exec(`${startCmd} "${reportOutcome.htmlPath}"`);
        console.log(`${colors.green}Opened report in browser.${colors.reset}\n`);
        promptUser();
      } else if (choice === '7') {
        rl.close();
        main();
      } else if (choice === 'Q') {
        console.log(`${colors.cyan}Exiting Raqeeb. Goodbye!${colors.reset}`);
        rl.close();
        process.exit(0);
      } else {
        console.log(`${colors.red}Invalid choice. Enter 6, 7, or Q.${colors.reset}\n`);
        promptUser();
      }
    });
  };

  promptUser();
}

if (require.main === module) {
  main();
}
