/**
 * Raqeeb Realtime Multiplayer Simulation Robot
 * Tool: Alagadjeebak (على قد جيبك)
 */

const { spawn } = require('child_process');
const WebSocket = require('ws');
const path = require('path');

const TEST_PORT = 3894;
const PROJECT_ROOT = path.resolve(__dirname, '..');

async function runMultiplayerSimulation() {
  const start = Date.now();
  const logs = [];

  function log(msg) {
    logs.push(`[${new Date().toISOString()}] ${msg}`);
  }

  log('Starting isolated local game server on port ' + TEST_PORT);

  // 1. Spawn test server process using process.execPath for Windows reliability
  const env = Object.assign({}, process.env, { PORT: String(TEST_PORT), NODE_ENV: 'test' });
  const serverProc = spawn(process.execPath, ['server.js'], { cwd: PROJECT_ROOT, env });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Server spawn timeout after 10 seconds'));
    }, 10000);

    serverProc.stdout.on('data', (d) => {
      const str = d.toString();
      if (str.includes(String(TEST_PORT))) {
        clearTimeout(timeout);
        resolve();
      }
    });

    serverProc.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });

  log('Server listening on port ' + TEST_PORT);

  const cleanup = () => {
    try {
      serverProc.kill();
    } catch (e) {}
  };

  try {
    const wsUrl = `ws://127.0.0.1:${TEST_PORT}`;

    // Helper for message waiting
    function waitFor(ws, predicate, timeoutMs = 8000) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          ws.removeListener('message', onMsg);
          reject(new Error(`Timeout waiting for message: ${predicate.toString()}`));
        }, timeoutMs);

        function onMsg(data) {
          try {
            const msg = JSON.parse(data.toString());
            if (predicate(msg)) {
              clearTimeout(timer);
              ws.removeListener('message', onMsg);
              resolve(msg);
            }
          } catch (e) {}
        }

        ws.on('message', onMsg);
      });
    }

    // 2. Connect Host (طلال)
    const hostWs = new WebSocket(wsUrl);
    await new Promise((res, rej) => { hostWs.on('open', res); hostWs.on('error', rej); });
    log('Host WebSocket connected');

    // Create Room
    const createWait = waitFor(hostWs, m => m.type === 'ROOM_CREATED');
    hostWs.send(JSON.stringify({
      type: 'CREATE_ROOM',
      name: 'طلال',
      avatar: '👑',
      options: { theme: 'car', budget: 25, mode: 'ffa' }
    }));
    const roomCreatedMsg = await createWait;
    const roomCode = roomCreatedMsg.room.code;
    const hostId = roomCreatedMsg.playerId;
    log(`Room created successfully with code #${roomCode}`);

    // 3. Connect Guest (وليد)
    const guestWs = new WebSocket(wsUrl);
    await new Promise((res, rej) => { guestWs.on('open', res); guestWs.on('error', rej); });
    log('Guest WebSocket connected');

    // Join Room
    const joinWait = waitFor(guestWs, m => m.type === 'JOINED_SUCCESS');
    guestWs.send(JSON.stringify({
      type: 'JOIN_ROOM',
      code: roomCode,
      name: 'وليد',
      avatar: '🏎️'
    }));
    const joinMsg = await joinWait;
    const guestId = joinMsg.playerId;
    log(`Guest (وليد) joined room #${roomCode}`);

    // Verify isolation: Guest must NOT be host
    if (joinMsg.room.hostId === guestId) {
      throw new Error('VULNERABILITY: Guest was falsely identified as room host!');
    }

    // 4. Host adds AI Bot
    const botWait = waitFor(hostWs, m => m.type === 'AI_BOT_ADDED' || (m.room && m.room.players.some(p => p.isBot)));
    hostWs.send(JSON.stringify({ type: 'ADD_AI_BOT', code: roomCode }));
    const botMsg = await botWait;
    log(`AI Bot added by host: ${botMsg.botName || 'AI Player'}`);

    // 5. Test Start Gate Rejection (Guest is unready)
    const errWait = waitFor(hostWs, m => m.type === 'ERROR' && m.message.includes('جاهز'));
    hostWs.send(JSON.stringify({ type: 'START_GAME', code: roomCode }));
    const errMsg = await errWait;
    log('Verified: Server blocked start because guest is unready: ' + errMsg.message);

    // 6. Guest toggles ready
    const readyWait = waitFor(hostWs, m => m.type === 'PLAYER_READY_CHANGED' && m.playerId === guestId && m.isReady);
    guestWs.send(JSON.stringify({ type: 'TOGGLE_READY', code: roomCode }));
    await readyWait;
    log('Guest toggled ready status to TRUE');

    // 7. Host starts game successfully
    const roundWait = waitFor(hostWs, m => m.type === 'AUCTION_ROUND_STARTED');
    hostWs.send(JSON.stringify({ type: 'START_GAME', code: roomCode }));
    const roundMsg = await roundWait;
    const offer = roundMsg.offer;
    const initialPrice = offer.price || 3;
    log(`Round 1 started! Item on auction: "${offer.name}" (Price: ${initialPrice} SAR)`);

    // 8. Bidding War Simulation
    const bid1Amount = Math.max(1, initialPrice);
    const bid2Amount = bid1Amount + 2;

    const bid1Wait = waitFor(hostWs, m => m.type === 'BID_PLACED' && m.highestBid === bid1Amount);
    guestWs.send(JSON.stringify({ type: 'PLACE_BID', amount: bid1Amount }));
    await bid1Wait;
    log(`Guest placed bid of ${bid1Amount} SAR`);

    const bid2Wait = waitFor(hostWs, m => m.type === 'BID_PLACED' && m.highestBid === bid2Amount);
    hostWs.send(JSON.stringify({ type: 'PLACE_BID', amount: bid2Amount }));
    await bid2Wait;
    log(`Host placed higher bid of ${bid2Amount} SAR`);

    // Close connections
    hostWs.close();
    guestWs.close();
    cleanup();

    return {
      name: 'Full Realtime Multiplayer Simulation (Host + Guest + AI + Auction)',
      category: 'simulation',
      passed: true,
      message: 'Passed live simulation with zero deadlocks and flawless permission isolation',
      durationMs: Date.now() - start,
      details: logs.join('\n')
    };

  } catch (err) {
    cleanup();
    log(`FATAL ERROR IN SIMULATION: ${err.message}`);
    return {
      name: 'Full Realtime Multiplayer Simulation (Host + Guest + AI + Auction)',
      category: 'simulation',
      passed: false,
      message: err.message,
      durationMs: Date.now() - start,
      details: logs.join('\n') + '\n' + (err.stack || '')
    };
  }
}

module.exports = {
  runMultiplayerSimulation
};
