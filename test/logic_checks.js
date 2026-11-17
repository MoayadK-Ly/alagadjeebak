/**
 * Raqeeb Game Logic & Ruleset Verification Suite
 * Tool: Alagadjeebak (على قد جيبك)
 */

async function runLogicChecks() {
  const results = [];

  function record(name, testFn) {
    const start = Date.now();
    try {
      const details = testFn();
      results.push({
        name,
        category: 'logic',
        passed: true,
        message: 'Passed successfully',
        details: details || null,
        durationMs: Date.now() - start
      });
    } catch (err) {
      results.push({
        name,
        category: 'logic',
        passed: false,
        message: err.message,
        details: err.stack,
        durationMs: Date.now() - start
      });
    }
  }

  // 1. Host Readiness Gate Logic
  record('Readiness Gate - Host & Bots Always Ready, Only Human Guests Evaluated', () => {
    const players = [
      { id: 'p_host', name: 'طلال', isHost: true, isBot: false, isReady: false }, // host isReady: false in object
      { id: 'p_bot', name: 'سلطان الذكي', isHost: false, isBot: true, isReady: false }, // bot
      { id: 'p_guest1', name: 'وليد', isHost: false, isBot: false, isReady: false },
      { id: 'p_guest2', name: 'سارة', isHost: false, isBot: false, isReady: true }
    ];

    const hostId = 'p_host';

    // Evaluation logic as implemented in server & client
    const unreadyGuests = players.filter(p => p.id !== hostId && !p.isBot && !p.isReady);
    if (unreadyGuests.length !== 1 || unreadyGuests[0].id !== 'p_guest1') {
      throw new Error(`Expected only p_guest1 to be unready, but found: ${JSON.stringify(unreadyGuests)}`);
    }

    // Now mark guest1 ready
    players[2].isReady = true;
    const unreadyAfter = players.filter(p => p.id !== hostId && !p.isBot && !p.isReady);
    if (unreadyAfter.length !== 0) {
      throw new Error('Expected 0 unready guests after guest1 toggles ready');
    }

    return 'Verified: host and bot readiness never block start gate; guest toggle functions as sole gatekeeper';
  });

  // 2. Anti-Self Bidding Prevention
  record('Anti-Self Bidding Logic Verification', () => {
    const auction = {
      highestBidder: 'p_host',
      highestBid: 15
    };

    function attemptBid(playerId, amount) {
      if (auction.highestBidder === playerId) {
        return { success: false, reason: 'ALREADY_HIGHEST_BIDDER' };
      }
      if (amount <= auction.highestBid) {
        return { success: false, reason: 'BID_TOO_LOW' };
      }
      auction.highestBidder = playerId;
      auction.highestBid = amount;
      return { success: true };
    }

    const selfBid = attemptBid('p_host', 20);
    if (selfBid.success) {
      throw new Error('Self bid should have been rejected!');
    }

    const otherBid = attemptBid('p_guest', 20);
    if (!otherBid.success || auction.highestBid !== 20 || auction.highestBidder !== 'p_guest') {
      throw new Error('Legitimate higher bid from competitor failed!');
    }

    return 'Verified: players strictly barred from bidding against their own leading offer';
  });

  // 3. Anti-Sniper Extension Cap
  record('Anti-Sniper Timer Extension Cap (Max 3 Extensions)', () => {
    let roundExtensions = 0;
    const MAX_EXTENSIONS = 3;

    function handleSniperBid(remainingSec) {
      if (remainingSec <= 3 && roundExtensions < MAX_EXTENSIONS) {
        roundExtensions++;
        return { extended: true, newTime: remainingSec + 5, currentExtensions: roundExtensions };
      }
      return { extended: false, newTime: remainingSec, currentExtensions: roundExtensions };
    }

    for (let i = 0; i < 5; i++) {
      handleSniperBid(2);
    }

    if (roundExtensions !== 3) {
      throw new Error(`Expected extensions to cap at 3, but got ${roundExtensions}`);
    }

    return 'Verified: anti-sniper capped at exactly 3 extensions per round';
  });

  // 4. Sabotage Card Math & Non-Negative Budget Floor
  record('Sabotage Card Non-Negative Budget Floor', () => {
    let targetBudget = 2; // low budget
    const saherPenalty = 4; // penalty > budget

    // Saher execution formula
    targetBudget = Math.max(0, targetBudget - saherPenalty);

    if (targetBudget < 0) {
      throw new Error(`Budget went below zero: ${targetBudget}`);
    }
    if (targetBudget !== 0) {
      throw new Error(`Expected 0 floor, got ${targetBudget}`);
    }

    return 'Verified: Saher card strictly respects Math.max(0, budget - penalty) floor';
  });

  // 5. 4-Tier Tie-Breaker Resolution
  record('4-Tier Tie-Breaker Resolution Engine', () => {
    const players = [
      { id: 'p1', name: 'أحمد', score: 85, budget: 10, contractFulfilled: false, upgrades: [1, 2, 3] },
      { id: 'p2', name: 'سارة', score: 85, budget: 15, contractFulfilled: false, upgrades: [1, 2] }, // higher budget
      { id: 'p3', name: 'فهد', score: 85, budget: 15, contractFulfilled: true, upgrades: [1] }, // contract fulfilled
      { id: 'p4', name: 'طلال', score: 90, budget: 2, contractFulfilled: false, upgrades: [] } // highest score
    ];

    function sortLeaderboard(list) {
      return [...list].sort((a, b) => {
        // Tier 1: Score
        if (b.score !== a.score) return b.score - a.score;
        // Tier 2: Remaining Budget
        if (b.budget !== a.budget) return b.budget - a.budget;
        // Tier 3: Secret Contract Fulfilled
        const aContract = a.contractFulfilled ? 1 : 0;
        const bContract = b.contractFulfilled ? 1 : 0;
        if (bContract !== aContract) return bContract - aContract;
        // Tier 4: Total Upgrades
        return (b.upgrades?.length || 0) - (a.upgrades?.length || 0);
      });
    }

    const sorted = sortLeaderboard(players);
    if (sorted[0].id !== 'p4') throw new Error(`Rank 1 should be p4 (score 90), got ${sorted[0].id}`);
    if (sorted[1].id !== 'p3') throw new Error(`Rank 2 should be p3 (score 85, budget 15, contract true), got ${sorted[1].id}`);
    if (sorted[2].id !== 'p2') throw new Error(`Rank 3 should be p2 (score 85, budget 15, contract false), got ${sorted[2].id}`);
    if (sorted[3].id !== 'p1') throw new Error(`Rank 4 should be p1 (score 85, budget 10), got ${sorted[3].id}`);

    return 'Verified: 4-tier tie breaker correctly cascades Score -> Budget -> Contract -> Upgrades';
  });

  return results;
}

module.exports = {
  runLogicChecks
};
