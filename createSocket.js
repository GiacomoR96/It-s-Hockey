console.log("Avvio processo socketServer..");
var express = require('express');
var app = express();
var EventEmitter = require('events').EventEmitter;
var logger = new EventEmitter();
var port = 8081;
var http = require('http');
var usersSocket = [];
var serverWebSocket = http.createServer(app);

var listener = require('socket.io')(serverWebSocket);

listener.listen(8081, function(){
    console.log("socketServer sono in ascolto sulla porta " + listener.address().port); 
});

listener.on("connection", (client) =>{
    console.log("socketServer: Qualcuno ha mandato un messaggio sulla socket.");
    
    client.on("requestStartGame", (data) =>{
        var oggettoDaSalvare = {
            socket : client,
            nickname: data.nickname,
            stanza : data.stanza
        }
    
        console.log("Il giocatore ",data.nickname," ha mandato un messaggio sulla socket!");
        usersSocket[usersSocket.length] = oggettoDaSalvare;
        process.send({event:"requestStartGame",nick:oggettoDaSalvare.nickname,stanza:oggettoDaSalvare.stanza});
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
    console.log("Messaggio mandato: \t",data);

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