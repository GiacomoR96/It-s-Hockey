/* Inizializzazione del figlio */

var express = require("express");
var app = express();
var EventEmitter = require("events").EventEmitter;
var logger = new EventEmitter();
var logs = require("./log");


console.log("ServerGiocoFiglio avviato...");

/* var clients = [];
var clients_nickname = []; */
var nickname1;
var nickname2;

var dataClients = [];
var initialPositionClients = [400,700,400,700];
var initialPositionBall = [400,450];    //400,565
var punteggioPartita = [];
var punteggioFinale = 20;               //7
var puck;
var posBaseX = 400;
var posBaseY = 450;

logger.on("info", (message) =>{
    logs.info(message);
});

logger.on("error", (message) =>{
    logs.error(message);
});

process.on('message', (data) => {
    console.log('Processo Figlio ha ricevuto: ', data);

    switch(data.event){
        case "login":{
            // event:"login"    nick1:"blabla"  nick2:"azazaz"

            nickname1 = data.nick1;
            nickname2 = data.nick2;

            for(var i=1;i<=2;i++){

                var x = initialPositionClients[0]?initialPositionClients[0]:null;
                var y = initialPositionClients[1]?initialPositionClients[1]:null;
                initialPositionClients.splice(0, 2);

                var dataCurrentClient = {
                    posX : x,
                    posY : y,
                    nickname: clients_nickname[i]
                }

                dataClients[i] = dataCurrentClient;

                punteggioPartita[i] = 0;
                var nick = (i==1)?nickname1:nickname2;
                var nick_rival = (i==1)?nickname2:nickname1;
                
                process.send({nick:nick,event:"positionBall",x: initialPositionBall[0], y:initialPositionBall[1]});
                process.send({nick:nick,event:"users_game", nick_rival:nick_rival});
                process.send({nick:nick,event:"setIDPorta", idPorta:i});
                process.send({nick:nick,event:"start_game", start:true});
            }
            break;
        }
        case "myPosition":{

            if(data.nick==nickname1)    process.send({nick:data.nick,event:"myPosition",data:dataClients[0]});
            else                        process.send({nick:data.nick,event:"myPosition",data:dataClients[1]});

            break;
        }
        case "rivalPosition": {

            if(data.nick==nickname1)    process.send({nick:data.nick,event:"rivalPosition",posX:dataClients[1].posX,posY:(dataClients[1].posY-500)});
            else                        process.send({nick:data.nick,event:"rivalPosition",posX:dataClients[0].posX,posY:(dataClients[0].posY-500)});

            break;
        }




















    }



/*
    client.on('userslist', (dati) =>{                          // metodo da usare nel caso un client decida di scegliere contro chi giocare 
        client.emit("users_list", {users: clients.nickname});
    });
*/
/*    
    client.on('invited_game', () =>{                          // metodo da usare nel caso un client decida di scegliere contro chi giocare 
        io.broadcast.emit("start_game");
    });
*/


    client.on('rivalPosition', (data) =>{

       
    });

    client.on('puckPosition', (data) =>{
    //  clients_nickname[data.nickname]
        puck = data.puck;
        console.log("COLLISIONE PUCK - ",puck);
        for(var i=0;i<clients_nickname.length;i++){
            var obj = clients[data.nickname];
            obj.socket.emit("puckPosition",{puck: puck});
            
            /* if(data.nickname != clients_nickname[i]){
                client.emit("puckPosition",{puck:puck});
                i=clients_nickname.length;
            } */
        }

    });

    client.on('moveMyPosition', (data) =>{
    //    console.log("***");
        dataClients[data.nickname].posX = data.x;
        dataClients[data.nickname].posY = data.y;
    //    console.log("ParteIniziale X= ",dataClients[data.nickname].posX,", Y=",dataClients[data.nickname].posY);
        var risY;
        var risX;
    //    console.log("Valore di ris=",risY);
        var diffY = posBaseY-dataClients[data.nickname].posY;
        var diffX = posBaseX-dataClients[data.nickname].posX;
    //    console.log("DIFFERENZA= ",diffY);

        risY=posBaseY+diffY;
        risX=posBaseX+diffX; 

    //    console.log("VALOREEEEE =",risY);
        var tmp = dataClients[data.nickname];
    //    console.log("TMP ==> X=",tmp.posX,", Y=",tmp.posY);

        tmp.posY=risY;
        tmp.posX=risX;
        
//        console.log("OBJ X:",tmp.posX,", Y:",tmp.posY);     
        var obj = clients[data.nickname_rival];
        obj.socket.emit("moveRivalPosition",tmp);
    });

    client.on('goalSuffered', (data) =>{
        
        for(var i=0;i<clients_nickname.length;i++){
            if(data.nickname != clients_nickname[i]){
                console.log("Gol effettuato da: ",clients_nickname[i],"!!!");
                punteggioPartita[clients_nickname[i]]+=1;
            }
        }
        // Controlliamo il punteggio dei giocatori e se sono arrivati al punteggioFinale, la partita termina
        for(var i=0;i<clients_nickname.length;i++){
            if(punteggioPartita[clients_nickname[0]] >= punteggioFinale || punteggioPartita[clients_nickname[1]] >= punteggioFinale){
                var obj = clients[clients_nickname[i]];
                obj.socket.emit("finishGame");
            }
        }

        for(var i=0;i<clients_nickname.length;i++){
            var obj = clients[clients_nickname[i]];

            obj.socket.emit("refreshScoreGame",{nickname: clients_nickname[0], score:punteggioPartita[clients_nickname[0]]});
            obj.socket.emit("refreshScoreGame",{nickname: clients_nickname[1], score:punteggioPartita[clients_nickname[1]]});

//obj.socket.emit("positionBall", {x:400, y:565});
        }
        console.log("PUNTEGGIO : ",punteggioPartita[clients_nickname[0]], " - ", punteggioPartita[clients_nickname[1]]);
    });

});


app.use('/', express.static('www'));

serverWeb.listen(port, () =>{
    logger.emit("info","Server avviato sulla porta ",port);
});
