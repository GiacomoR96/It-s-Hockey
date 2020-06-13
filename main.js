var http = require('http');
var fs = require('fs');
var mysql = require('mysql');

const { fork } = require('child_process');
var socketFE = fork('createSocket.js');

var roomList = [];
var livEXP = [10, 25, 45, 75, 115, 165, 230, 310, 405, 530];
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
  socketFE.send({event: 'updateRooms', nickname: nickname, data: refreshRoomsList()});
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
  socketFE.send({event: 'updateRooms', nickname: room.nickname1, data: refreshRoomsList()});
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
  if(room.nickname1 == nickname) {
    return room.nickname2;
  }
  return room.nickname1;
}

function prepareGame(room, nickname) {
  createInstanceGame(room, nickname);
  socketFE.send({event: 'waitingGame', nickname: room.nickname1});
  socketFE.send({event: 'waitingGame', nickname: room.nickname2});
}

function sendServerGame(room, data) {
  if(room && !room.finish) {
    room.instance.send(data);
  }
}

/* COMUNICAZIONE DA SOCKET_FE e PADRE */
socketFE.on('message', (data) => {
  var params = data.data;
  switch (data.event) {
    case 'getRooms': {
      socketFE.send({event: 'getRooms', nickname: data.nickname, data: refreshRoomsList()});
      break;
    }
    case 'joinIntoRoom': {
      var room = findRoom(params.id);

      if (room.state == 'busy') {
        socketFE.send({event: 'busyRoom', nickname: data.nickname});
      } 
      else if (room.type == 'private') {
        if(room.password == params.password ) {
          prepareGame(room, data.nickname);
        } else {
          socketFE.send({event: 'passwordError', nickname: data.nickname});
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
      socketFE.send({event: 'updateRooms', nickname: data.nickname, data: refreshRoomsList()});
      socketFE.send({event: 'waitingPlayer', nickname: data.nickname});
      break;
    }
    case 'loginUser': {
      var query = `SELECT COUNT(nickname) FROM giocatore WHERE BINARY nickname='${params.nickname}' AND BINARY password='${params.password}'`

      connectDB(query, queryDB).then((result) => {
        if (result.error != null || Object.values(result.data[0])[0] === 0) {
          socketFE.send({event: 'endSocket', nickname: params.nickname, data: {path: '/errorPage.html', message: `Errore nell'inserimento dei dati!`}});
        } else {
          socketFE.send({event: 'redirect', nickname: params.nickname, data: {path: '/mainGame.html', key: params.nickname}});
        }
      });
      break;
    }
    case 'dataUser': {
      var query = `SELECT nickname, level, exp FROM giocatore WHERE BINARY nickname='${data.nickname}'`;

      connectDB(query, queryDB).then((result) => {
        if (result.error != null || result.data.length === 0) {
          socketFE.send({event: 'redirect', nickname: params.nickname,  data: {path: '/errorPage.html', message: `PAGINA NON TROVATA!`}});
        } else {
          socketFE.send({event: 'dataUser', nickname: data.nickname, data: result.data[0]});
        }
      });
      break;
    }
    case 'registrationUser': {
      var query = `INSERT INTO giocatore(Nickname, Password) VALUES ('${params.nickname}', '${params.password}')`;

      connectDB(query, queryDB).then((result) => {
        if (result.error != null || result.data.length === 0) {
          socketFE.send({event: 'endSocket', nickname: params.nickname, data: {path: '/errorPage.html', message: `Account gia' esistente!`}});
        } else {
          socketFE.send({event: 'endSocket', nickname: params.nickname, data: {path: '/errorPage.html', message: `Registrazione effettuata!`}});
        }
      });
      break;
    }
    case 'cancelGameWaiting': {
      var room = findRoomWithNickname(data.nickname);
      socketFE.send({event: 'eraseRoom', nickname: data.nickname});
      deleteRoom(room);
      break;
    }
    case 'cancelGameLoading': {
      var room = findRoomWithNickname(data.nickname);
      var rival = findRivalNickname(room, data.nickname);
      socketFE.send({event: 'eraseRoom', nickname: rival});
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
      var query = `SELECT level, exp FROM giocatore WHERE BINARY nickname='${data.nickname}'`;
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
            socketFE.send({event: 'redirect', nickname: data.nickname,  data: {path: '/errorPage.html', message: `PAGINA NON TROVATA!`}});
          } else {
            socketFE.send({event: 'matchReport', nickname: data.nickname, data: { dataUser: result.data[0], report}});
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
        socketFE.send({event: 'notFoundRoom', nickname: data.nickname});
      }
      break;
    }
  }
});

function updateStatPlayers(con, data) {
  saveDataDB(data.winner, expWinner);
  saveDataDB(data.loser, expLoser);
}

function messageServerGame(room) {
  room.instance.on('message', (data) => {
    switch (data.event) {
      case 'startGame' : {
        socketFE.send({event: 'redirect', nickname: data.nickname, data: {path: '/startGame.html', key: data.nickname}});
        break;
      }
      case 'puckPosition': {
        socketFE.send(data);
        break;
      }
      case 'rivalData': {
        socketFE.send(data);
        break;
      }
      case 'myPosition': {
        socketFE.send(data);
        break;
      }
      case 'launchGame': {
        socketFE.send(data);
        break;
      }
      case 'moveRivalPosition': {
        socketFE.send(data);
        break;
      }
      case 'refreshScoreGame': {
        socketFE.send(data);
        break;
      }
      case 'finishGame': {
        socketFE.send(data);
        break;
      }
      case 'updateDataDB': {
        connectDB(data, updateStatPlayers);
        break;
      }
      case 'setPuckPosition': {
        socketFE.send(data);
        break;
      }
      case 'continueGame': {
        socketFE.send(data);
        break;
      }
      case 'stopServerGame': {
        var room = findRoomWithNickname(data.nickname);
        room.winner = data.result.winner;
        room.loser = data.result.loser;
        room.instance.kill('SIGINT');

        socketFE.send({event: 'redirect', nickname: room.nickname1, data: {path: '/finishGame.html'}});
        socketFE.send({event: 'redirect', nickname: room.nickname2, data: {path: '/finishGame.html'}});
        break;
      }
    }
  });
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

function saveDataDB(user, score) {
  var query = `SELECT nickname, level, exp FROM giocatore WHERE BINARY nickname='${user}'`;

  connectDB(query, queryDB).then((result) => {
    if (result.error != null || result.data.length === 0) throw err;
    else {
      var newExp = result.data[0].exp + score;
      var level = result.data[0].level;
      if (level < livEXP.length && newExp >= livEXP[level]) {
        level++;
      }
      var query2 = `UPDATE giocatore SET level='${level}', exp='${newExp}' WHERE BINARY nickname='${user}'`;
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

http.createServer((req, res) => {
  if (req.method == 'GET') {
    routePage(req.url, res);
  }
}).listen(8080, () => {
    console.log('Server avviato sulla porta: ', 8080);
});