/* Inizializzazione del figlio */

var express = require("express");
var app = express();
var EventEmitter = require("events").EventEmitter;      //
var logger = new EventEmitter();                        //
var logs = require("./log");                            //

console.log("ServerGiocoFiglio avviato...");

var nickname1;
var nickname2;
var id;

var dataClients = [];
var initialPositionClients = [400,700,400,700];
var initialPositionBall = [400,450];    //400,565
var punteggioPartita = [];
var punteggioFinale = 20;               //7
var puck;
var posBaseX = 400;
var posBaseY = 450;

process.on('message', (data) => {
    console.log("SERVER_GAME ha ricevuto: ",data);

    switch(data.event){
        case "id":{
            id = data.indice;
            break;
        }
        case "login":{

            nickname1 = data.nick1;
            nickname2 = data.nick2;

            for(var i=1;i<=2;i++){

                var x = initialPositionClients[0]?initialPositionClients[0]:null;
                var y = initialPositionClients[1]?initialPositionClients[1]:null;
                initialPositionClients.splice(0, 2);

                var dataCurrentClient = {
                    posX : x,
                    posY : y,
                    nickname: i==1?nickname1:nickname2
                }

                dataClients[i] = dataCurrentClient;
                console.log(" ");
                console.log("SERVER_FIGLIO_DataClient:",dataClients[i]);
                punteggioPartita[i] = 0;
                var nick = (i==1)?nickname1:nickname2;
                var nick_rival = (i==1)?nickname2:nickname1;
                
                process.send({A:"CIAO",id:id,nick:nick,event:"positionBall",x: initialPositionBall[0], y:initialPositionBall[1]});
                process.send({id:id,nick:nick,event:"users_game", nick_rival:nick_rival});
                process.send({id:id,nick:nick,event:"setIDPorta", idPorta:i});
                process.send({id:id,nick:nick,event:"start_game", start:true});
            }
            break;
        }
        case "myPosition":{

            if(data.nick==nickname1)    process.send({id:id,nick:nickname1,event:"myPosition",data:dataClients[0]});
            else                        process.send({id:id,nick:nickname2,event:"myPosition",data:dataClients[1]});

            break;
        }
        case "rivalPosition": {

            if(data.nick==nickname1)    process.send({id:id,nick:nickname2,event:"rivalPosition",posX:dataClients[1].posX,posY:(dataClients[1].posY-500)});
            else                        process.send({id:id,nick:nickname1,event:"rivalPosition",posX:dataClients[0].posX,posY:(dataClients[0].posY-500)});

            break;
        }
        case "puckPosition": {
            
            puck = data.data.puck;
            if(data.nick==nickname1)    process.send({id:id,nick:nickname2,event:"puckPosition",puck:puck});
            else                        process.send({id:id,nick:nickname1,event:"puckPosition",puck:puck});

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

            risY=posBaseY+diffY;
            risX=posBaseX+diffX;

            var tmp = dataClients[i];
            tmp.posY=risY;
            tmp.posX=risX;

            if(data.nick==nickname1)    process.send({id:id,nick:nickname2,event:"moveRivalPosition",posX:tmp.posX,posY:tmp.posY});
            else                        process.send({id:id,nick:nickname1,event:"moveRivalPosition",posX:tmp.posX,posY:tmp.posY});

            break;
        }
        case "goalSuffered": {

            var i = (data.nick==nickname1)?1:0;
            punteggioPartita[i]+=1;
            
            if(punteggioPartita[0] >= punteggioFinale || punteggioPartita[1] >= punteggioFinale){
                process.send({id:id,nick:nickname1,event:"finishGame"});
                process.send({id:id,nick:nickname2,event:"finishGame"});
            }

            process.send({id:id,nick:nickname1,event:"refreshScoreGame",nickname: nickname1, score:punteggioPartita[0]});
            process.send({id:id,nick:nickname1,event:"refreshScoreGame",nickname: nickname2, score:punteggioPartita[1]});

            process.send({id:id,nick:nickname2,event:"refreshScoreGame",nickname: nickname1, score:punteggioPartita[0]});
            process.send({id:id,nick:nickname2,event:"refreshScoreGame",nickname: nickname2, score:punteggioPartita[1]});
            
            break;
        }
        

    }



});