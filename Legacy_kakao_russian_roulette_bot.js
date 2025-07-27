// kakao_russian_roulette_bot.js
// Pure JS for messenger bot: ignore any text except defined commands

// -- Global game storage --
var games = {};
var gameCounter = 1;

// Entry point: this function is called on each incoming message
function response(room, msg, sender, isGroupChat, replier) {
  var parts = msg.trim().split(/\s+/);
  var cmd = parts[0];
  // Define allowed commands
  var valid = ['?러시안룰렛', '?게임규칙', '?상태', '?게임참가', '?게임시작', '?발사', '?게임종료'];
  // If not one of the commands, ignore
  if (valid.indexOf(cmd) === -1) return;
  // Otherwise handle
  var reply = handleCommand(sender, msg);
  if (reply) replier.reply(reply);
}

// Dispatch commands
function handleCommand(user, message) {
  var parts = message.trim().split(/\s+/);
  var cmd = parts[0];
  var arg = parts[1] || '';

  if (cmd === '?러시안룰렛') return startGame(user);
  if (cmd === '?게임규칙')    return showRules();
  if (cmd === '?상태')       return showStatus(user);
  if (cmd === '?게임참가')    return joinGame(user, arg);
  if (cmd === '?게임시작')    return beginGame(user, arg);
  if (cmd === '?발사')       return fire(user);
  if (cmd === '?게임종료')    return endGame(user, arg);
  // unreachable due to guard in response
}

// Render game state
function renderGameState(game) {
  return '참가자: ' + game.players.join(', ') + '\n'
       + '인원수: ' + game.players.length + '명\n'
       + '호스트: ' + game.host + '\n'
       + '게임 번호: ' + game.id;
}

// Find a game containing the user
function findUserGame(user) {
  for (var id in games) {
    if (games.hasOwnProperty(id) && games[id].players.indexOf(user) !== -1) {
      return games[id];
    }
  }
  return null;
}

// Start or create a new game
function startGame(user) {
  var exist = findUserGame(user);
  if (exist && !exist.started) {
    return '이미 다른 게임 준비상태에 참가되어 있습니다 (게임 번호: ' + exist.id + ').';
  }
  var id = gameCounter++;
  var game = { id: id, host: user, players: [user], turnIndex: 0, started: false };
  games[id] = game;
  return renderGameState(game);
}

// Show rules
function showRules() {
  return '게임 규칙:\n'
       + '1. ?러시안룰렛 : 새 게임 생성 및 참가\n'
       + '2. ?게임참가 [번호] : 해당 게임 참가\n'
       + '3. ?상태 : 현재 참가 중인 게임 번호 확인\n'
       + '4. ?게임시작 [번호] : 호스트가 게임 시작\n'
       + '5. ?발사 : 차례에 총을 발사 (1/6 확률 사망)\n'
       + '6. ?게임종료 [번호] : 호스트가 게임 강제 종료\n'
       + '- 준비 상태에만 참가 가능, 시작 후 참가 불가\n'
       + '- 사망 시 즉시 게임 종료';
}

// Show user status
function showStatus(user) {
  var g = findUserGame(user);
  return g ? '현재 참가 중인 게임 번호: ' + g.id : '게임에 참가하지 않았습니다.';
}

// Join game
function joinGame(user, arg) {
  var id = parseInt(arg, 10);
  var g = games[id];
  if (!g)        return '해당 게임을 찾을 수 없습니다.';
  if (g.started) return '게임이 이미 진행 중입니다.';
  if (g.players.indexOf(user) !== -1) return '이미 이 게임에 참가되어 있습니다.';
  var exist = findUserGame(user);
  if (exist && !exist.started && exist.id !== id) {
    return '이미 다른 게임 준비상태에 참가되어 있습니다 (게임 번호: ' + exist.id + ').';
  }
  g.players.push(user);
  return renderGameState(g);
}

// Begin game by host
function beginGame(user, arg) {
  var id = parseInt(arg, 10);
  var g = games[id];
  if (!g)             return '해당 게임을 찾을 수 없습니다.';
  if (g.host !== user) return '호스트만 게임을 시작할 수 있습니다.';
  if (g.started)      return '이미 시작된 게임입니다.';
  g.started = true;
  return '게임이 시작되었습니다! 첫 번째 차례: ' + g.players[0];
}

// Fire command
function fire(user) {
  var g = findUserGame(user);
  if (!g || !g.started) return '게임이 진행 중이 아닙니다.';
  if (g.players[g.turnIndex] !== user) return '턴이 아닙니다.';
  var shot = Math.ceil(Math.random() * 6);
  if (shot === 1) {
    delete games[g.id];
    return user + '님이 사망하셨습니다! 게임 종료.';
  }
  g.turnIndex = (g.turnIndex + 1) % g.players.length;
  return '생존하셨습니다! 다음 차례: ' + g.players[g.turnIndex];
}

// End game by host
function endGame(user, arg) {
  var id = parseInt(arg, 10);
  var g = games[id];
  if (!g)             return '해당 게임을 찾을 수 없습니다.';
  if (g.host !== user) return '호스트만 게임을 종료할 수 있습니다.';
  delete games[id];
  return '게임 ' + id + ' 종료 완료.';
}
