console.log("Avvio processo socket!!");
var express = require('express');
var app = express();
var EventEmitter = require('events').EventEmitter;          // Forse
var logger = new EventEmitter();
var port = 8081;
var logs = require("./log");
var http = require('http');
var usersSocket = [];
//var LIMIT = 8;

                                                                                /* 
                                                                                const stringifyObject = require('stringify-object'); */
var serverWebSocket = http.createServer(app);

var listener = require('socket.io')(serverWebSocket);

listener.listen(8081, function(){
    console.log("socketServer sono in ascolto sulla porta " + listener.address().port); 
});

//Forse da togliere
logger.on("info", (message) =>{
    logs.info(message);
});

logger.on("error", (message) =>{
    logs.error(message);
});


/*      DA FARE QUESTO CASO

        
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

*/

listener.on("connection", (client) =>{
    console.log("-----------------socketServer: Qualcuno ha mandato un messaggio sulla socket figlio!");
    
//    console.log("contenuto:\n",client);

//    console.log("CONTENUTO=>",client);

    client.on("requestStartGame", (data) =>{
            
        var oggettoDaSalvare = {
            socket : client,
            nickname: data.nickname,
            stanza : data.stanza
        }
    
        console.log("Il giocatore ",data.nickname," ha mandato un messaggio sulla socket!");
        usersSocket[usersSocket.length] = oggettoDaSalvare;
        
        process.send({event:"requestStartGame",nick:oggettoDaSalvare.nickname,stanza:oggettoDaSalvare.stanza});
    
        // Non è stato possibile mandare un intero riferimento al padre
        //    process.send( JSON.stringify({socket: oggettoDaSalvare.socket, nickname: oggettoDaSalvare.nickname}) );
    });

    client.on("myPosition", (data) =>{
        var nick;
        for(var i=0;i<usersSocket.length;i++){
            if(client == usersSocket[i].socket){
                nick = usersSocket[i].nickname;
            }
        }

        process.send({event:"myPosition",data:data,nick:nick});
    });

    client.on("rivalPosition", (data) =>{
        var nick;
        for(var i=0;i<usersSocket.length;i++){
            if(client == usersSocket[i].socket){
                nick = usersSocket[i].nickname;
            }
        }

        process.send({event:"rivalPosition", data:data,nick:nick});
    });

    client.on("moveMyPosition", (data) =>{
        var nick;
        for(var i=0;i<usersSocket.length;i++){
            if(client == usersSocket[i].socket){
                nick = usersSocket[i].nickname;
            }
        }

        process.send({event:"moveMyPosition", data:data,nick:nick});
    });

    client.on("goalSuffered", (data) =>{
        var nick;
        for(var i=0;i<usersSocket.length;i++){
            if(client == usersSocket[i].socket){
                nick = usersSocket[i].nickname;
            }
        }

        process.send({event:"goalSuffered", data:data,nick:nick});
    });

    client.on("puckPosition", (data) =>{
        var nick;
        for(var i=0;i<usersSocket.length;i++){
            if(client == usersSocket[i].socket){
                nick = usersSocket[i].nickname;
            }
        }
        
        process.send({event:"puckPosition", data:data.data,nick:nick});
    });

    client.on("puckInitialize", (data) =>{
        var nick;
        for(var i=0;i<usersSocket.length;i++){
            if(client == usersSocket[i].socket){
                nick = usersSocket[i].nickname;
            }
        }

        process.send({event:"puckInitialize", data:data,nick:nick});
    });
});

process.on("message", (data) => {
    
    //  console.log("MSG MANDATO: \t",data);

    //Attraverso questo ciclo prendiamo il riferimento alla socket interessata
    var socketClient;
    for(var i=0;i<usersSocket.length;i++){
        if(data.nick===usersSocket[i].nickname){
            socketClient=usersSocket[i].socket;
        }
    }

    switch(data.event){
        case "myPosition":{
            socketClient.emit(data.event,data.data);
            break;
        }
        case "positionBall":{
            socketClient.emit(data.event,data.data);
            break;
        }
        case "users_game":{
            socketClient.emit(data.event,data.rival);
            break;
        }
        case "setIDPorta":{
            socketClient.emit(data.event,data.idPorta);
            break;
        }
        case "start_game":{
            socketClient.emit(data.event,data.start);
            break;
        }
        case "rivalPosition":{
            socketClient.emit(data.event,data.data);
            break;
        }
        case "puckPosition":{
            socketClient.emit(data.event,data.data);
            break;
        }
        case "moveRivalPosition":{
            socketClient.emit(data.event,data.data);
            break;
        }
        case "finishGame":{
            socketClient.emit(data.event);
            break;
        }
        case "refreshScoreGame":{
            socketClient.emit(data.event,data.data);
            break;
        }
        case "setPositionPuck":{
            socketClient.emit(data.event,data.data);
            break;
        }
    }
});