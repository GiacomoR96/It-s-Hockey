var fs = require('fs');
var mysql = require('mysql');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var socket = require('socket.io')(server);
var paths = ['/favicon.ico', '/', '/images/loading.gif', '/startGame.html', '/www/js/game.js', '/www/js/phaser.js', '/www/img/Sfondo_.png', '/www/img/borderLeft.png', '/www/img/borderTop.png', '/www/img/borderRight.png', '/www/img/borderBottom.png', '/www/img/puck.png', '/www/img/striker.png', '/finishGame.html', '/mainGame.html', '/index.html', '/registration.html', '/www/js/script.js', '/contact.html', '/css/animate.css', '/css/icomoon.css', '/css/bootstrap.css', '/css/style.css', '/js/modernizr-2.6.2.min.js', '/js/jquery.min.js', '/js/jquery.easing.1.3.js', '/js/bootstrap.min.js', '/js/jquery.waypoints.min.js', '/js/main.js', '/images/loader.gif', '/images/img_bg_2.jpg', '/images/sfondoWeb2.png', '/fonts/icomoon/icomoon.ttf', '/errorPage.html'];
var usersSocket = [];

const { fork } = require('child_process');

var roomList = [];
var expWinner = 7;
var expLoser = 3;

var roomParams = {
  id: null,
  instance: null,
  nickname1: null,
  nickname2: null,
  type: null,
  password: null,
  state: 'free',
  name: null,
  winner: null,
  loser: null,
  countReport: 0,
  finish: false
};

function findNickname(socket) {
  for(var i=0; i<usersSocket.length; i++) {
      if(usersSocket[i].socket == socket) {
          return usersSocket[i].nickname;
      }
  }
  return null;
}

function getSocket(nickname) {
  for(var i=0; i<usersSocket.length; i++) {
      if(usersSocket[i].nickname == nickname) {
          return usersSocket[i].socket;
      }
  }
  return null;
}

function findSocketIndex(nickname) {
  for(var i=0; i<usersSocket.length; i++) {
      if(usersSocket[i].nickname == nickname) {
          return i;
      }
  }
  return null;
}

function refreshRoomsList() {
  var response = [];
  roomList.forEach((element) => {
    var room = {
      id: element.id,
      nickname1: element.nickname1,
      nickname2: element.nickname2,
      name: element.name,
      state: element.state,
      type: element.type
    };
    response.push(room);
  });
  return response;
}

function connect(con, data, func) {
  return new Promise(async function (resolve) {
    var executeQuery = await function () {
      return new Promise((resolve) => {
        con.connect(async function (err) {
          if (err) throw err;
          console.log('Connessione al db riuscita..');
          var result = await func(con, data);
          resolve(result);
        });
      });
    };
    executeQuery().then((result) => {
      resolve(result);
    });
  });
}

async function connectDB(data, func) {
  var con = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'dbgiocohockey',
  });
  if (!con) {
    console.log('Connessione Fallita!\nImpossibile aggiornare i dati dei player dopo la partita!');
  }
  var result = await connect(con, data, func).then((data) => (result = data));
  return result;
}

function createInstanceGame(room, nickname) {
  updateRoom(room, nickname);
  sendMessage({event: 'updateRooms', nickname: nickname, data: refreshRoomsList()});
  room.instance = fork('serverGame.js');
  messageServerGame(room);
  room.instance.send({
    event:'gameUsers',
    nickname1: room.nickname1,
    nickname2: room.nickname2
  });
}

function updateRoom(room, nickname) {
  room.state = 'busy';
  room.nickname2 = nickname;
}

function deleteRoom(room) {
  if(room.instance) {
    room.finish = true;
    room.instance.kill('SIGINT');
  }
  var indexRoom;
  for(var i=0; i<roomList.length; i++) {
    if(roomList[i].id == room.id) {
      indexRoom = i;
      break;
    }
  }
  roomList.splice(indexRoom, 1);
  sendMessage({event: 'updateRooms', nickname: room.nickname1, data: refreshRoomsList()});
}

function findRoom(id) {
  for(var i=0; i<roomList.length; i++) {
    if(roomList[i].id == id) {
      return roomList[i];
    }
  }
  return null;
}

function findRoomWithNickname(nickname) {
  for(var i=0; i<roomList.length; i++) {
    if(roomList[i].nickname1 == nickname || roomList[i].nickname2 == nickname) {
      return roomList[i];
    }
  }
  return null;
}

function findFreeRoom() {
  for(var i=0; i<roomList.length; i++) {
    if(roomList[i].type == 'public') {
      return roomList[i];
    }
  }
  return null;
}

function findRivalNickname(room, nickname) {
  if (room) {
    if(room.nickname1 == nickname) {
      return room.nickname2;
    }
    return room.nickname1;
  }
}

function prepareGame(room, nickname) {
  createInstanceGame(room, nickname);
  sendMessage({event: 'waitingGame', nickname: room.nickname1});
  sendMessage({event: 'waitingGame', nickname: room.nickname2});
}

function sendServerGame(room, data) {
  if(room && room.instance && !room.finish) {
    room.instance.send(data);
  }
}

function eventMessage(data) {
  var params = data.data;
  switch (data.event) {
    case 'getRooms': {
      sendMessage({event: 'getRooms', nickname: data.nickname, data: refreshRoomsList()});
      break;
    }
    case 'joinIntoRoom': {
      var room = findRoom(params.id);

      if (room.state == 'busy') {
        sendMessage({event: 'busyRoom', nickname: data.nickname});
      } 
      else if (room.type == 'private') {
        if(room.password == params.password ) {
          prepareGame(room, data.nickname);
        } else {
          sendMessage({event: 'passwordError', nickname: data.nickname});
        }
      }
      else {
        prepareGame(room, data.nickname);
      }
      break;
    }
    case 'createRoom': {
      var newRoom = {...roomParams};
      newRoom.id = roomList.length;
      newRoom.nickname1 =  data.nickname;
      newRoom.type = params.type;
      if (params.type === 'private') {
        newRoom.password = params.password
      }
      newRoom.name = params.name;
      roomList.push(newRoom);
      sendMessage({event: 'updateRooms', nickname: data.nickname, data: refreshRoomsList()});
      sendMessage({event: 'waitingPlayer', nickname: data.nickname});
      break;
    }
    case 'loginUser': {
      var query = `SELECT COUNT(nickname) FROM players WHERE BINARY nickname='${params.nickname}' AND BINARY password='${params.password}'`

      connectDB(query, queryDB).then((result) => {
        if (result.error != null || Object.values(result.data[0])[0] === 0) {
          sendMessage({event: 'endSocket', nickname: params.nickname, data: {path: '/errorPage.html', message: `Errore nell'inserimento dei dati!`}});
        } else {
          sendMessage({event: 'redirect', nickname: params.nickname, data: {path: '/mainGame.html', key: params.nickname}});
        }
      });
      break;
    }
    case 'dataUser': {
      var query = `SELECT nickname, level, exp FROM players WHERE BINARY nickname='${data.nickname}'`;

      connectDB(query, queryDB).then((result) => {
        if (result.error != null || result.data.length === 0) {
          sendMessage({event: 'redirect', nickname: params.nickname,  data: {path: '/errorPage.html', message: `PAGINA NON TROVATA!`}});
        } else {
          sendMessage({event: 'dataUser', nickname: data.nickname, data: result.data[0]});
        }
      });
      break;
    }
    case 'registrationUser': {
      var query = `INSERT INTO players(Nickname, Password) VALUES ('${params.nickname}', '${params.password}')`;

      connectDB(query, queryDB).then((result) => {
        if (result.error != null || result.data.length === 0) {
          sendMessage({event: 'endSocket', nickname: params.nickname, data: {path: '/errorPage.html', message: `Account gia' esistente!`}});
        } else {
          sendMessage({event: 'endSocket', nickname: params.nickname, data: {path: '/errorPage.html', message: `Registrazione effettuata!`}});
        }
      });
      break;
    }
    case 'cancelGameWaiting': {
      var room = findRoomWithNickname(data.nickname);
      sendMessage({event: 'eraseRoom', nickname: data.nickname});
      deleteRoom(room);
      break;
    }
    case 'cancelGameLoading': {
      var room = findRoomWithNickname(data.nickname);
      var rival = findRivalNickname(room, data.nickname);
      sendMessage({event: 'eraseRoom', nickname: rival});
      deleteRoom(room);
      break;
    }
    case 'requestStartGame': {
      var room = findRoomWithNickname(data.nickname);
      sendServerGame(room, data);
      break;
    }
    case 'puckPosition': {
      var room = findRoomWithNickname(data.nickname);
      sendServerGame(room, data);
      break;
    }
    case 'moveMyPosition': {
      var room = findRoomWithNickname(data.nickname);
      sendServerGame(room, data);
      break;
    }
    case 'goalSuffered': {
      var room = findRoomWithNickname(data.nickname);
      sendServerGame(room, data);
      break;
    }
    case 'matchReport': {
      var room = findRoomWithNickname(data.nickname);
      var query = `SELECT level, exp FROM players WHERE BINARY nickname='${data.nickname}'`;
      if(room) {
        room.countReport += 1;
        var report = {};
        if(room.winner == data.nickname) {
          report.expGained = expWinner;
          report.status = 'vinto';
        } else {
          report.expGained = expLoser;
          report.status = 'perso';
        }

        connectDB(query, queryDB).then((result) => {
          if (result.error != null || result.data.length === 0) {
            sendMessage({event: 'redirect', nickname: data.nickname,  data: {path: '/errorPage.html', message: `PAGINA NON TROVATA!`}});
          } else {
            sendMessage({event: 'matchReport', nickname: data.nickname, data: { dataUser: result.data[0], report}});
          }
        });

        if(room.countReport == 2) {
          deleteRoom(room);
        }
      }
      break;
    }
    case 'quickGame': {
      var room = findFreeRoom();
      if(room) {
        prepareGame(room, data.nickname);
      } else {
        sendMessage({event: 'notFoundRoom', nickname: data.nickname});
      }
      break;
    }
    case 'exitPlayer': {
      var room = endGame(data);
      sendMessage({event: 'redirect', nickname: room.nickname1, data: {path: '/finishGame.html'}});
      sendMessage({event: 'redirect', nickname: room.nickname2, data: {path: '/finishGame.html'}});
      break;
    }
    case 'quitPlayer': {
      var room = endGame(data);
      room.countReport++;
      sendMessage({event: 'redirect', nickname: room.winner, data: {path: '/finishGame.html'}});
      break;
    }
  }
}

function endGame(data) {
  var room = findRoomWithNickname(data.nickname);
  room.winner = findRivalNickname(room, data.nickname);
  room.loser = data.nickname;
  connectDB({winner: room.winner, loser: room.loser}, updateStatPlayers);
  room.instance.kill('SIGINT');
  return room;
}

function updateStatPlayers(con, data) {
  saveDataDB(data.winner, expWinner);
  saveDataDB(data.loser, expLoser);
}

function messageServerGame(room) {
  room.instance.on('message', (data) => {
    switch (data.event) {
      case 'startGame' : {
        sendMessage({event: 'redirect', nickname: data.nickname, data: {path: '/startGame.html', key: data.nickname}});
        break;
      }
      case 'puckPosition': {
        sendMessage(data);
        break;
      }
      case 'rivalData': {
        sendMessage(data);
        break;
      }
      case 'myPosition': {
        sendMessage(data);
        break;
      }
      case 'launchGame': {
        sendMessage(data);
        break;
      }
      case 'moveRivalPosition': {
        sendMessage(data);
        break;
      }
      case 'refreshScoreGame': {
        sendMessage(data);
        break;
      }
      case 'finishGame': {
        sendMessage(data);
        break;
      }
      case 'updateDataDB': {
        connectDB(data, updateStatPlayers);
        break;
      }
      case 'setPuckPosition': {
        sendMessage(data);
        break;
      }
      case 'continueGame': {
        sendMessage(data);
        break;
      }
      case 'stopServerGame': {
        var room = findRoomWithNickname(data.nickname);
        room.winner = data.result.winner;
        room.loser = data.result.loser;
        room.instance.kill('SIGINT');

        sendMessage({event: 'redirect', nickname: room.nickname1, data: {path: '/finishGame.html'}});
        sendMessage({event: 'redirect', nickname: room.nickname2, data: {path: '/finishGame.html'}});
        break;
      }
    }
  });
}

socket.on('connection', (client) => {
  console.log('socketServer: Qualcuno ha mandato un messaggio sulla socket.');

  client.on('updateSocket', (nickname) => {
      var index = findSocketIndex(nickname);
      if (index == null || index == undefined) {
          client.emit('redirect', {path: '/errorPage.html', message: `PAGINA NON TROVATA!`});
      } else {
          usersSocket[index].socket = client;
          client.emit('updateSocket');
      }
  });

  client.on('dataUser', () => {
      eventMessage({event:'dataUser', nickname: findNickname(client)});
  });

  client.on('getRooms', () => {
      eventMessage({event:'getRooms', nickname: findNickname(client)});
  });

  client.on('joinIntoRoom', (data) => {
      eventMessage({event:'joinIntoRoom', nickname: findNickname(client), data: data.data});
  });

  client.on('createRoom', (data) => {
      eventMessage({event:'createRoom', nickname: findNickname(client), data: data.data});
  });

  client.on('loginUser', (data) => {
      var index = findSocketIndex(data.data.nickname);
      if((index != null || index != undefined) && usersSocket[index].socket) {
          usersSocket[index].socket.emit('redirect', {path: '/errorPage.html', message: `Qualcuno ha effettuato l'accesso al tuo account!`});
          usersSocket.splice(index, 1);
      }

      var socketClient = {
          socket : client,
          nickname: data.data.nickname
      }
      usersSocket.push(socketClient);
      eventMessage({event:'loginUser', data: data.data});
  });
  
  client.on('registrationUser', (data) => {
      var socketClient = {
          socket : client,
          nickname: data.data.nickname
      }
      usersSocket.push(socketClient);
      eventMessage({event:'registrationUser', data: data.data});
  });

  client.on('logout', () => {
      usersSocket.splice(findSocketIndex(findNickname(client)), 1);
  });

  client.on('cancelGameWaiting', () => {
      eventMessage({event:'cancelGameWaiting', nickname: findNickname(client)});
  });

  client.on('cancelGameLoading', () => {
      eventMessage({event:'cancelGameLoading', nickname: findNickname(client)});
  });

  client.on('requestStartGame', (data) =>{
      eventMessage({event:'requestStartGame', nickname: findNickname(client)});
  });

  client.on('puckPosition', (data) => {
      eventMessage({event:'puckPosition', nickname: findNickname(client), data: data.data});
  });

  client.on('moveMyPosition', (data) => {
      eventMessage({event:'moveMyPosition', nickname: findNickname(client), data: data.data});
  });

  client.on('goalSuffered', () => {
      eventMessage({event:'goalSuffered', nickname: findNickname(client)});
  });

  client.on('matchReport', () => {
      eventMessage({event:'matchReport', nickname: findNickname(client)});
  });

  client.on('backToMain', () => {
      client.emit('redirect', {path: '/mainGame.html'});
  });

  client.on('quickGame', () =>{
      eventMessage({event:'quickGame', nickname: findNickname(client)});
  });

  client.on('exitPlayer', () =>{
      eventMessage({event:'exitPlayer', nickname: findNickname(client)});
  });

  client.on('quitPlayer', () =>{
      eventMessage({event:'quitPlayer', nickname: findNickname(client)});
  });
});

function sendMessage(data) {
  console.log('Messaggio mandato: \t',data);
    var socketClient = getSocket(data.nickname);
    if (socketClient) {
      switch (data.event) {
        case 'getRooms': {
            socketClient.emit(data.event, data.data);
            break;
        }
        case 'busyRoom': {
            socketClient.emit(data.event);
            break;
        }
        case 'passwordError': {
            socketClient.emit(data.event);
            break;
        }
        case 'updateRooms': {
            socket.sockets.emit('getRooms', data.data);
        }
        case 'redirect': {
            socketClient.emit(data.event, data.data);
            break;
        }
        case 'endSocket': {
            socketClient.emit('redirect', data.data);
            usersSocket.splice(findSocketIndex(data.nickname), 1);
            break;
        }
        case 'dataUser': {
            socketClient.emit(data.event, data.data);
            break;
        }
        case 'waitingPlayer': {
            socketClient.emit(data.event);
            break;
        }
        case 'waitingGame': {
            socketClient.emit(data.event);
            break;
        }
        case 'eraseRoom': {
            socketClient.emit(data.event);
            break;
        }
        case 'puckPosition': {
            socketClient.emit(data.event,data.data);
            break;
        }
        case 'rivalData': {
            socketClient.emit(data.event,data.data);
            break;
        }
        case 'myPosition': {
            socketClient.emit(data.event,data.data);
            break;
        }
        case 'launchGame': {
            socketClient.emit(data.event);
            break;
        }
        case 'moveRivalPosition': {
            socketClient.emit(data.event,data.data);
            break;
        }
        case 'refreshScoreGame': {
            socketClient.emit(data.event,data.data);
            break;
        }
        case 'finishGame': {
            socketClient.emit(data.event,data.data);
            break;
        }
        case 'setPuckPosition': {
            socketClient.emit(data.event,data.data);
            break;
        }
        case 'continueGame': {
            socketClient.emit(data.event,data.data);
            break;
        }
        case 'matchReport': {
            socketClient.emit(data.event,data.data);
            break;
        }
        case 'notFoundRoom': {
            socketClient.emit(data.event);
            break;
        }
      }
    }
}

function queryDB(con, operation) {
  var response = {
    error: null,
    data: null,
  };
  return new Promise((resolve) => {
    con.query(operation, function (err, result) {
      if (err) {
        console.log(`Errore nell'esecuzione della query: ${err.sql},\ncode: ${err.code},\nsqlMessage: ${err.sqlMessage}`);
        response.error = err;
      } else {
        console.log(`Risultato query : ${result}`);
        response.data = result;
      }
      resolve(response);
    });
  });
}

function nextLevel(level){
  return Math.round((4 * (Math.pow(level,3))) / 5)
}

function calculateLevel(player) {
  var newLevel = player.level;
  while (nextLevel(newLevel) < player.exp) {
    newLevel++;
  }
  return newLevel;
}

function saveDataDB(user, score) {
  var query = `SELECT nickname, level, exp FROM players WHERE BINARY nickname='${user}'`;

  connectDB(query, queryDB).then((result) => {
    if (result.error != null || result.data.length === 0) throw err;
    else {
      var newExp = result.data[0].exp + score;
      var level = calculateLevel(result.data[0]);
      var query2 = `UPDATE players SET level='${level}', exp='${newExp}' WHERE BINARY nickname='${user}'`;
      connectDB(query2, queryDB);
    }
  });
}

function retriveType(url) {
  if (url.includes('css')) {
    return 'css';
  }
  else if (url.includes('js')) {
    return 'javascript';
  }
  return 'html';
}

function checkIsRoot(url) {
  return url == '/' ? '/index.html' : url;
}

function routePage(url, res) {
  var path = __dirname + checkIsRoot(url) + '';
  if (fs.existsSync(path) == false) {
    path = __dirname + '/errorPage.html';
    res.setHeader('Set-Cookie', 'message=PAGINA NON TROVATA!;');
  }

  fs.readFile(path, function (err, data) {
    if (err) {
      console.log(err);
    } else {
      res.writeHead(200, { 'Content-Type': 'text/' + retriveType(url) });
      res.write(data);
      res.end();
    }
  });
}

app.get(paths, function (req, res) {
  routePage(req.url, res);
});

server.listen(8080, () => console.log("In ascolto sulla porta 8080..."));