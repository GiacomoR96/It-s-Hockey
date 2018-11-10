/* Inizializzazione del figlio */

var express = require("express");
var app = express();
var EventEmitter = require("events").EventEmitter;
var logger = new EventEmitter();
var logs = require("./log");

var port = 8081;

var serverWeb = http.createServer(app);
var socketServerWeb = require('socket.io')(serverWeb);

console.log("ServerFiglio avviato sull porta ",port,"...");

var clients = [];
var clients_nickname = [];
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

logger.emit("info", "Avvio del server in corso...");

socketServerWeb.on('connection', (client) =>{
    console.log("Qualcuno si e' collegato!");

    client.on('login', (data) =>{
        
        var oggettoDaSalvare = {
            socket : client,
            nickname: data.nickname
        }

        // SITUAZIONE DEL LOGIN TRAMITE DISCONNESSIONE

        for(var i=0;i<clients_nickname.length;i++){
            if(data.nickname == clients_nickname[i]){
                clients[data.nickname] = oggettoDaSalvare;
                var obj = clients[clients_nickname[i]];

                obj.socket.emit("myPosition",dataClients[clients_nickname[i]]);

                for(var i=0;i<clients_nickname.length;i++){
                    if(data.nickname != clients_nickname[i]){
                        obj.socket.emit("rivalPosition",dataClients[clients_nickname[i]]);
                        i=clients_nickname.length;
                    }
                }

                //(PASSAGGIO POSIZIONE PALLINA)

                //(PASSAGGIO PUNTEGGIO PARTITA)
                obj.socket.emit("refreshScoreGame",{nickname: clients_nickname[0], score:punteggioPartita[clients_nickname[0]]});
                obj.socket.emit("refreshScoreGame",{nickname: clients_nickname[1], score:punteggioPartita[clients_nickname[1]]});
                               
                obj.socket.emit("start_game",{start:true});
                obj.socket.emit("users_game", {users: clients_nickname});
                
                // FORSE RETURN
                // return 0;
            }
        }    

        clients[data.nickname] = oggettoDaSalvare;    // viene salvato il nuovo client nell'array che contiene i riferimenti a tutti i client connessi
        clients_nickname.push(data.nickname);         // viene salvato il nickname nell'array contenente tutti i nickname dei client connessi
        console.log("Si è collegato il giocatore: ", data.nickname);
        console.log("Giocatori connessi: ", clients_nickname);

        if(clients_nickname.length>1){
            for(var i=0;i<clients_nickname.length;i++){
                if(clients[clients_nickname[i]]){
                    
                    if(!dataClients[clients_nickname[i]]){
                        
                        var x = initialPositionClients[0]?initialPositionClients[0]:null;
                        var y = initialPositionClients[1]?initialPositionClients[1]:null;
                        initialPositionClients.splice(0, 2);

                        var dataCurrentClient = {
                            posX : x,
                            posY : y,
                            nickname: clients_nickname[i]
                        }

                        dataClients[clients_nickname[i]] = dataCurrentClient;
                    }
                    
                    punteggioPartita[clients_nickname[i]] = 0;

                    var obj = clients[clients_nickname[i]];
                    obj.socket.emit("positionBall", {x: initialPositionBall[0], y:initialPositionBall[1]});
                    obj.socket.emit("users_game", {users: clients_nickname});
                    obj.socket.emit("setIDPorta",{idPorta:i});
                    obj.socket.emit("start_game",{start:true});
                }

            }
        }
    });
/*
    client.on('userslist', (dati) =>{                          // metodo da usare nel caso un client decida di scegliere contro chi giocare 
        client.emit("users_list", {users: clients.nickname});
    });
*/
    client.on('disconnection', (data) =>{
        var nick = data.nickname;
        console.log("Si sta disconnettendo: ", nick);
        console.log("Prima della disconnessione: ", clients_nickname);  
        console.log("ARRAY CLIENTS prima: ");
        var bool = false;

        for(var i =0;i<clients_nickname.length;i++){
            if(clients_nickname[i] == nick){
                bool = true;
                i = clients_nickname.length;
            }
        }
        if(bool){

            delete clients[nick];
            /*
                if(clients_nickname.indexOf(nick)) {
                    clients_nickname.splice(clients_nickname.indexOf(nick), 1);
                }
            */
            console.log("[");
            for(var i =0;i<=(clients_nickname.length)-1;i++){
                if(clients[clients_nickname[i]]){
                console.log(clients[clients_nickname[i]].nickname);
                }
            }
            console.log("]");
            console.log("Si è disconnesso: ", nick);

        }
        
    });
/*    
    client.on('invited_game', () =>{                          // metodo da usare nel caso un client decida di scegliere contro chi giocare 
        io.broadcast.emit("start_game");
    });
*/

    client.on('myPosition', (data) =>{
        var obj = clients[data.nickname];
        obj.socket.emit("myPosition",dataClients[data.nickname]);
    });

    client.on('rivalPosition', (data) =>{

       var obj = clients[data.nickname];
       var tmp = dataClients[data.nickname_rival];
       tmp.posY-=500;
    
       obj.socket.emit("rivalPosition",tmp);
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
