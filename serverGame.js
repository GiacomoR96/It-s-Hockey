console.log(`Instanza serverGame avviata con PID:(${process.pid})`);

var nickname1;
var nickname2;
var scorePlayer1 = 0;
var scorePlayer2 = 0;
var continueGame = true;

var initialPositionClients = [400,700];
var initialPositionBall = [400,450];
var punteggioFinale = 7;
var posBaseX = 400;
var posBaseY = 450;

var baseDelay = 4000;
var startDelay = 10000;

function delayMessage(event, delay) {
    setTimeout(function myTime() {
        if(event == 'continueGame') continueGame = true;
        process.send({event:event, nickname: nickname1});
        process.send({event:event, nickname: nickname2});
    }, delay);
}

function resetServer(result) {
    setTimeout(function myTime() {
        process.send({event:'stopServerGame', nickname: nickname1, result});
    }, startDelay);
}

function findRivalNickname(nickname) {
    if(nickname1 == nickname) {
      return nickname2;
    }
    return nickname1;
}

function difference(a, b) {
    return a - b;
}

process.on('message', (data) => {
    switch(data.event){
        case 'gameUsers': {
            nickname1 = data.nickname1;
            nickname2 = data.nickname2;
            break;
        }
        case 'requestStartGame': {
            process.send({event:'puckPosition', nickname: data.nickname, data: initialPositionBall});
            var positionRival = {
                posX : initialPositionClients[0],
                posY : initialPositionClients[1]-500
            }
            process.send({event:'rivalData', nickname: data.nickname, data: {nickname: findRivalNickname(data.nickname), position: positionRival}});
            process.send({event:'myPosition', nickname: data.nickname, data: initialPositionClients});
            process.send({event:'launchGame', nickname: data.nickname});
            break;
        }
        case 'puckPosition': {
            // Gestione della specularita' del puck
            var position = {
                posX : posBaseX + difference(posBaseX, data.data[0]),
                posY : posBaseY + difference(posBaseY, data.data[1])
            };
            process.send({event:'puckPosition', nickname: findRivalNickname(data.nickname), data: [position.posX, position.posY]});
            break;
        }
        case 'moveMyPosition': {
            var position = {
                posX : posBaseX + difference(posBaseX, data.data[0]),
                posY : posBaseY + difference(posBaseY, data.data[1])
            };
            process.send({event:'moveRivalPosition', nickname: findRivalNickname(data.nickname), data: [position.posX, position.posY]});
            break;
        }
        case 'goalSuffered': {
            if(continueGame) {
                continueGame = false;
                if(nickname1 == data.nickname) {
                    scorePlayer2 += 1;
                } else {
                    scorePlayer1 += 1;
                }
                // Giocatore che ha subito il gol (VANTAGGIO DI POSIZIONE)
                process.send({event:'refreshScoreGame', nickname: nickname1, data: {scorePlayer: scorePlayer1, scoreRival: scorePlayer2}});
                // Giocatore che ha segnato il gol
                process.send({event:'refreshScoreGame', nickname: nickname2, data: {scorePlayer: scorePlayer2, scoreRival: scorePlayer1}});

                if(scorePlayer1 >= punteggioFinale || scorePlayer2 >= punteggioFinale){
                    var winner;
                    var loser;
                    if(scorePlayer2>scorePlayer1) {
                        winner = nickname2;
                        loser = nickname1;
                    } else {
                        winner = nickname1;
                        loser = nickname2;
                    }
                    process.send({event:'updateDataDB', winner, loser});
                    delayMessage('finishGame', baseDelay);
                    resetServer({winner, loser});
                }
                else {
                    process.send({event:'setPositionPuck', nickname: nickname1, data: [400,650]});
                    process.send({event:'setPositionPuck', nickname: nickname2, data: [400,250]});
                    delayMessage('continueGame', baseDelay);
                }
            }
            break;
        }
    }
});

delayMessage('startGame', startDelay);