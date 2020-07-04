console.log(`Instanza serverGame avviata con PID:(${process.pid})`);

var nickname1;
var nickname2;
var scorePlayer1 = 0;
var scorePlayer2 = 0;
var continueGame = true;

var positionBallPlayer1 = [400, 450];
var positionBallPlayer2 = [400, 450];
var positionRival = [400, 175];
var punteggioFinale = 7;
var posBaseX = 400;
var posBaseY = 450;

var baseDelay = 4000;
var startDelay = 10000;

function sendMessages(event) {
    if(event == 'continueGame') continueGame = true;
    process.send({event:event, nickname: nickname1});
    process.send({event:event, nickname: nickname2});
}

function delayMessage(event, delay) {
    setTimeout(function myTime() {
        sendMessages(event);
    }, delay);
}

function delayGoal(event, delay) {
    setTimeout(function myTime() {
        sendMessages(event);
        process.send({event:'setPuckPosition', nickname: nickname1, data: positionBallPlayer1});
        process.send({event:'setPuckPosition', nickname: nickname2, data: positionBallPlayer2});
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
            var positionBall;
            if(data.nickname == nickname1) {
                positionBall = positionBallPlayer1;
            } else {
                positionBall = positionBallPlayer2;
            }

            process.send({event:'puckPosition', nickname: data.nickname, data: positionBall});
            process.send({event:'rivalData', nickname: data.nickname, data: {nickname: findRivalNickname(data.nickname), position: positionRival}});
            process.send({event:'myPosition', nickname: data.nickname, data: [400, 725]});
            process.send({event:'refreshScoreGame', nickname: data.nickname, data: {scorePlayer: scorePlayer1, scoreRival: scorePlayer2}});
            process.send({event:'launchGame', nickname: data.nickname});
            break;
        }
        case 'puckPosition': {
            // Gestione della specularita' del puck
            var positionBall;
            var positionReflect = [posBaseX + difference(posBaseX, data.data[0]), posBaseY + difference(posBaseY, data.data[1])];
            if(data.nickname == nickname1) {
                positionBallPlayer1 = data.data;
                positionBallPlayer2 = positionReflect;
                positionBall = positionBallPlayer2;
            }
            else {
                positionBallPlayer2 = data.data;
                positionBallPlayer1 = positionReflect;
                positionBall = positionBallPlayer1;
            }

            process.send({event:'puckPosition', nickname: findRivalNickname(data.nickname), data: positionBall});
            break;
        }
        case 'moveMyPosition': {
            positionRival[0] = posBaseX + difference(posBaseX, data.data[0]);
            positionRival[1] = posBaseY + difference(posBaseY, data.data[1]);

            process.send({event:'moveRivalPosition', nickname: findRivalNickname(data.nickname), data: positionRival});
            break;
        }
        case 'goalSuffered': {
            if(continueGame) {
                continueGame = false;
                if(nickname1 == data.nickname) {
                    scorePlayer2 += 1;
                    positionBallPlayer1 = [400,650];
                    positionBallPlayer2 = [400,250]
                } else {
                    scorePlayer1 += 1;
                    positionBallPlayer1 = [400,250];
                    positionBallPlayer2 = [400,650];
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
                    delayGoal('continueGame', baseDelay);
                }
            }
            break;
        }
    }
});

delayMessage('startGame', startDelay);