// kakao_russian_roulette_bot.js
// Pure JS for messenger bot: fixed string literals in fire function

var games = {};
var gameCounter = 1;

// Entry point: handles incoming messages
function response(room, msg, sender, isGroupChat, replier) {
  var parts = msg.trim().split(/\s+/);
  var cmd = parts[0];
  var valid = ['?러시안룰렛', '?게임규칙', '?상태', '?게임참가', '?게임시작', '?발사', '?게임종료'];
  if (valid.indexOf(cmd) === -1) return;  // ignore other texts
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
  if (cmd === '?상태')        return showStatus(user);
  if (cmd === '?게임참가')    return joinGame(user, arg);
  if (cmd === '?게임시작')    return beginGame(user, arg);
  if (cmd === '?발사')        return fire(user);
  if (cmd === '?게임종료')    return endGame(user, arg);
}

// Render game state
function renderGameState(game) {
  return '참가자: ' + game.players.join(', ') + '\n'
       + '인원수: ' + game.players.length + '명\n'
       + '호스트: ' + game.host + '\n'
       + '게임 번호: ' + game.id;
}

// Find game containing user
function findUserGame(user) {
  for (var id in games) {
    if (games.hasOwnProperty(id) && games[id].players.indexOf(user) !== -1) {
      return games[id];
    }
  }
  return null;
}

// Start a new game or join pending
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

// Show detailed game rules
function showRules() {
  return '게임 규칙:\n'
       + '1. ?러시안룰렛 : 새 게임 생성 및 참가\n'
       + '2. ?게임참가 [번호] : 해당 게임 참가\n'
       + '3. ?상태 : 현재 참가 중인 게임 번호 확인\n'
       + '4. ?게임시작 [번호] : 호스트가 게임 시작\n'
       + '5. ?발사 : 차례에 총을 발사 (1/6 확률 사망)\n'
       + '6. ?게임종료 [번호] : 호스트가 게임 강제 종료\n'
       + '\n-- 솔로 매치 룰 --\n'
       + '• 참가자가 호스트 1명뿐인 경우, 단독으로 진행됩니다.\n'
       + '• 시작 시 "솔로 매치를 시작합니다!" 메시지가 표시됩니다.\n'
       + '• 플레이어는 자신의 차례마다 ?발사 명령어를 입력해 1/6 확률로 사망 여부를 확인합니다.\n'
       + '• 죽지 않으면 계속 턴을 반복합니다.\n'
       + '• 사망하면 "게임 종료" 메시지와 함께 게임이 종료됩니다.\n'
       + '\n-- 멀티 플레이어 매치 룰 --\n'
       + '• 참가자 2명 이상일 때 시작됩니다.\n'
       + '• 시작 시 "멀티 플레이어 매치를 시작합니다!" 메시지가 표시됩니다.\n'
       + '• 차례대로 ?발사 명령어를 입력해 1/6 확률로 사망 여부를 확인합니다.\n'
       + '• 사망 시 해당 플레이어는 탈락하며, "[이름]님이 사망하셨습니다!" 메시지가 표시됩니다.\n'
       + '• 호스트가 사망하면 생존자 중 랜덤으로 새 호스트가 지정되고, "새 호스트: [이름]" 메시지가 표시됩니다.\n'
       + '• 탈락 후 남은 플레이어들의 이름과 인원 수가 표시됩니다.\n'
       + '• 마지막 2명이 남으면 "Last Match!" 메시지가 표시됩니다.\n'
       + '• 최후의 1인이 남으면 "최후의 생존자는 [이름] 입니다!" 메시지가 표시되고, "게임 [번호] 종료 완료."가 표시됩니다.';
}

// Show user status
function showStatus(user) {
  var g = findUserGame(user);
  return g ? '현재 참가 중인 게임 번호: ' + g.id : '게임에 참가하지 않았습니다.';
}

// Join pending game
function joinGame(user, arg) {
  var id = parseInt(arg, 10);
  var g = games[id];
  if (!g) return '해당 게임을 찾을 수 없습니다.';
  if (g.started) return '게임이 이미 진행 중입니다.';
  if (g.players.indexOf(user) !== -1) {
    return '이미 이 게임에 참가되어 있거나, 중복된 닉네임은 허용되지 않습니다. 다른 닉네임으로 시도해주세요.';
  }
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
  if (!g) return '해당 게임을 찾을 수 없습니다.';
  if (g.host !== user) return '호스트만 게임을 시작할 수 있습니다.';
  if (g.started) return '이미 시작된 게임입니다.';
  g.started = true;
  var reply = '';
  if (g.players.length === 1) {
    reply += '솔로 매치를 시작합니다!\n';
  } else {
    reply += '멀티 플레이어 매치를 시작합니다!\n';
  }
  reply += '게임이 시작되었습니다! 첫 번째 차례: ' + g.players[g.turnIndex];
  if (g.players.length === 2) {
    reply += '\nLast Match!';
  }
  return reply;
}

// Fire command
function fire(user) {
  var g = findUserGame(user);
  if (!g || !g.started) return '게임이 진행 중이 아닙니다.';
  if (g.players[g.turnIndex] !== user) return '턴이 아닙니다.';

  var shot = Math.ceil(Math.random() * 6);
  if (shot === 1) {
    var died = user;
    var gameId = g.id;
    g.players.splice(g.turnIndex, 1);
    var msg = died + '님이 사망하셨습니다!';
    if (g.host === died && g.players.length > 0) {
      var idx = Math.floor(Math.random() * g.players.length);
      g.host = g.players[idx];
      msg += '\n새 호스트: ' + g.host;
    }
    if (g.players.length > 1) {
      msg += '\n남은 참가자: ' + g.players.join(', ');
      msg += '\n인원수: ' + g.players.length + '명';
      if (g.players.length === 2) {
        msg += '\nLast Match!';
      }
      if (g.turnIndex >= g.players.length) g.turnIndex = 0;
      return msg;
    } else if (g.players.length === 1) {
      var winner = g.players[0];
      msg += '\n최후의 생존자는 ' + winner + ' 입니다!';
      delete games[gameId];
      msg += '\n게임 ' + gameId + ' 종료 완료.';
      return msg;
    } else {
      delete games[gameId];
      msg += '\n게임 ' + gameId + ' 종료 완료.';
      return msg;
    }
  } else {
    g.turnIndex = (g.turnIndex + 1) % g.players.length;
    return '생존하셨습니다! 다음 차례: ' + g.players[g.turnIndex];
  }
}

// End game by host
function endGame(user, arg) {
  var id = parseInt(arg, 10);
  var g = games[id];
  if (!g) return '해당 게임을 찾을 수 없습니다.';
  if (g.host !== user) return '호스트만 게임을 종료할 수 있습니다.';
  delete games[id];
  return '게임 ' + id + ' 종료 완료.';
}
