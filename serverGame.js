/* Inizializzazione del figlio per la partita */
console.log("ServerGiocoFiglio avviato... PID:(",process.pid,")");

var express = require("express");
var app = express();
var nickname1;
var nickname2;
var id;
var continueGame = true;

var dataClients = [];
var initialPositionClients = [400,700,400,700];
var initialPositionBall = [400,450];    //400,565
var punteggioPartita = [];
var punteggioFinale = 3;               //7
var posBaseX = 400;
var posBaseY = 450;

function delayMessage(event) {
    setTimeout(function myTime() {
        if(event == "continueGame") continueGame = true;
        process.send({id:id, event:event});
    }, 4000);
}

function resetServer() {
    setTimeout(function myTime(){
        reset();
        process.send({id:id,event:"stopServerGame"});
    },8000);
}

reset = () => {
    // Azzeramento valori dopo il termine della partita
    nickname1 = nickname2 = "";

    dataClients = [];
    initialPositionClients = [400,700,400,700];
    punteggioPartita = [];    
}

process.on("message", (data) => {
    switch(data.event){
        case "id": {
            id = data.indice;
            break;
        }
        case "startUpServer": {
            nickname1 = data.nick1;
            nickname2 = data.nick2;
            
            for (var i=0; i<2; i++) {

                var x = initialPositionClients[0]?initialPositionClients[0]:null;
                var y = initialPositionClients[1]?initialPositionClients[1]:null;
                initialPositionClients.splice(0, 2);

                var dataCurrentClient = {
                    posX : x,
                    posY : y,
                    nickname: i==0?nickname1:nickname2
                }

                dataClients[i] = dataCurrentClient;
            
                punteggioPartita[i] = 0;
                var nick = (i==0)?nickname1:nickname2;
                var nick_rival = {
                    rival: (i==0)?nickname2:nickname1
                }
                var val_i = {idPorta:i};
                
                process.send({id:id,nick:nick,event:"puckPosition",data: initialPositionBall});
                process.send({id:id,nick:nick,event:"users_game",rival:nick_rival});
                process.send({id:id,nick:nick,event:"setIDPorta", idPorta:val_i});
                process.send({id:id,nick:nick,event:"start_game"});
            }

            process.send({id:id,nick:nickname1,event:"myPosition",data: dataClients[0]});
            process.send({id:id,nick:nickname2,event:"myPosition",data: dataClients[1]});

            break;
        }
        case "myPosition":{
            if (data.nick == nickname1) process.send({id:id,nick:nickname1,event:"myPosition",data:dataClients[0]});
            else                        process.send({id:id,nick:nickname2,event:"myPosition",data:dataClients[1]});

            break;
        }
        case "rivalPosition": {
            var tmp;
            if (data.nick == nickname1){
                tmp = {
                    posX : dataClients[1].posX,
                    posY : dataClients[1].posY-500,
                    nickname: nickname2
                }
                process.send({id:id,nick:nickname2,event:"rivalPosition",data:tmp});
            }
            else{
                tmp = {
                    posX : dataClients[0].posX,
                    posY : dataClients[0].posY-500,
                    nickname: nickname2
                }
                process.send({id:id,nick:nickname1,event:"rivalPosition",data:tmp});
            }
            break;
        }
        case "puckPosition": {
            // Gestione della specularita' del puck
            var name = (data.nick == nickname1) ? nickname2 : nickname1;
            
            var position = {
                posX : data.data[0],
                posY : data.data[1]
            };
           
            var risY;
            var risX;

            var diffY = posBaseY-position.posY;
            var diffX = posBaseX-position.posX;

            risY=posBaseY+diffY;
            risX=posBaseX+diffX;

            var tmp = position;
            tmp.posY=risY;
            tmp.posX=risX;

            process.send({id:id,nick:name,event:"puckPosition",data:[tmp.posX,tmp.posY]});

            break;
        }
        case "moveMyPosition": {
            var i = (data.nick==nickname1)?0:1;
            dataClients[i].posX = data.data.x;
            dataClients[i].posY = data.data.y;

            var risY;
            var risX;

            var diffY = posBaseY-dataClients[i].posY;
            var diffX = posBaseX-dataClients[i].posX;

            risY = posBaseY+diffY;
            risX = posBaseX+diffX;

            var tmp = dataClients[i];
            tmp.posY = risY;
            tmp.posX = risX;

            if (data.nick == nickname1) process.send({id:id,nick:nickname2,event:"moveRivalPosition",data:[tmp.posX,tmp.posY]});
            else                        process.send({id:id,nick:nickname1,event:"moveRivalPosition",data:[tmp.posX,tmp.posY]});

            break;
        }
        case "goalSuffered": {
            if(continueGame) {
                continueGame = false;
                var i = (data.nick == nickname1) ? 1 : 0;
                punteggioPartita[i]+=1;

                // Giocatore che ha subito il gol (VANTAGGIO DI POSIZIONE)
                process.send({id:id, nick:nickname1, event:"refreshScoreGame", data: { scorePlayer: punteggioPartita[0], scoreRival: punteggioPartita[1] }});
                // Giocatore che ha segnato il gol
                process.send({id:id, nick:nickname2, event:"refreshScoreGame", data: { scorePlayer: punteggioPartita[1], scoreRival: punteggioPartita[0] }});

                if(punteggioPartita[0] >= punteggioFinale || punteggioPartita[1] >= punteggioFinale){
                    process.send({id:id, event:"updateDataDB", nick1:nickname1, nick2:nickname2, winner: punteggioPartita[1]>punteggioPartita[0] ? nickname2 : nickname1});
                    delayMessage("finishGame");
                    resetServer();
                }
                else {
                    var name="";
                    name = (data.nick==nickname1) ? nickname1 : nickname2;
                    process.send({id:id, nick:name, event:"setPositionPuck", data:[400,650]});
                    
                    name = (data.nick==nickname1)?nickname2:nickname1;
                    process.send({id:id, nick:name, event:"setPositionPuck", data:[400,250]});
                
                    delayMessage("continueGame");
                }
            }
            break;
        }
    }
});